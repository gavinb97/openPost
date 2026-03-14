// ============================================================
// Research Post Processor — Research → Generate → Publish
// Gathers web research, feeds into LLM, posts informed content
// ============================================================

import { Worker, type Job as BullJob } from 'bullmq';
import crypto from 'crypto';
import { redis } from '../queues';
import { query, queryOne } from '../db';
import { generateResearchedContent } from '../ai';
import { gatherResearch } from '../research';
import { config } from '../config';
import { QUEUES } from '@onlyposts/shared';
import type { Agent, OAuthToken, PlatformAccount, WebResearchJobPayload, Platform } from '@onlyposts/shared';

// ============================================================
// Platform posting helpers (same as post.ts)
// ============================================================

async function getTokens(accountId: string): Promise<{ account: PlatformAccount; token: OAuthToken }> {
  const account = await queryOne<PlatformAccount>('SELECT * FROM platform_accounts WHERE id = $1', [accountId]);
  const token = await queryOne<OAuthToken>('SELECT * FROM oauth_tokens WHERE platform_account_id = $1', [accountId]);
  if (!account || !token) throw new Error(`Missing account/token for ${accountId}`);
  return { account, token };
}

async function postToTwitter(token: OAuthToken, text: string): Promise<{ id: string; url: string }> {
  const OAuth = (await import('oauth-1.0a')).default;
  const oauth = new OAuth({
    consumer: { key: config.twitter.appKey, secret: config.twitter.appSecret },
    signature_method: 'HMAC-SHA1',
    hash_function(bs: string, k: string) { return crypto.createHmac('sha1', k).update(bs).digest('base64'); },
  });

  const url = 'https://api.twitter.com/2/tweets';
  const tok = { key: token.access_token, secret: token.token_secret! };
  const header = oauth.toHeader(oauth.authorize({ url, method: 'POST' }, tok));

  const resp = await fetch(url, {
    method: 'POST',
    headers: { ...header, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  const data = await resp.json() as any;
  if (!resp.ok) throw new Error(`Twitter post failed: ${JSON.stringify(data)}`);
  return { id: data.data.id, url: `https://twitter.com/i/status/${data.data.id}` };
}

async function postToReddit(token: OAuthToken, subreddit: string, title: string, text: string): Promise<{ id: string; url: string }> {
  const resp = await fetch('https://oauth.reddit.com/api/submit', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token.access_token}`,
      'User-Agent': 'OnlyPosts/2.0',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      api_type: 'json', kind: 'self', sr: subreddit, title, text,
    }),
  });
  const data = await resp.json() as any;
  const postData = data?.json?.data;
  if (!postData?.id) throw new Error(`Reddit post failed: ${JSON.stringify(data?.json?.errors)}`);
  return { id: postData.id, url: postData.url || `https://reddit.com${postData.permalink}` };
}

// ============================================================
// Find a Reddit access token for the agent's user (for Reddit search)
// ============================================================

async function findRedditToken(userId: string): Promise<string | undefined> {
  const row = await queryOne<{ access_token: string }>(
    `SELECT ot.access_token FROM oauth_tokens ot
     JOIN platform_accounts pa ON pa.id = ot.platform_account_id
     WHERE pa.user_id = $1 AND pa.platform = 'reddit'
     LIMIT 1`,
    [userId],
  );
  return row?.access_token;
}

// ============================================================
// PROCESSOR
// ============================================================

export function startResearchProcessor() {
  const worker = new Worker<WebResearchJobPayload>(
    QUEUES.RESEARCH,
    async (job: BullJob<WebResearchJobPayload>) => {
      const { agent_id, platform_account_id, action_id, platform } = job.data;
      console.log(`[Research] Processing action ${action_id} for ${platform}`);

      try {
        // Load agent
        const agent = await queryOne<Agent>('SELECT * FROM agents WHERE id = $1', [agent_id]);
        if (!agent) throw new Error(`Agent ${agent_id} not found`);

        // Get platform account + tokens for posting
        const { account, token } = await getTokens(platform_account_id);

        // Get a Reddit token for Reddit search (may be same account or another)
        const redditToken = await findRedditToken(agent.user_id);

        // --- Phase 1: Gather research ---
        const researchResults = await gatherResearch(agent, redditToken);

        if (researchResults.length === 0) {
          console.warn(`[Research] No research results for agent "${agent.name}" — skipping`);
          await query(
            `UPDATE agent_actions SET status = 'failed', error_message = 'No research results found',
             executed_at = now() WHERE id = $1`,
            [action_id],
          );
          return;
        }

        // --- Phase 2: Generate content from research ---
        const generated = await generateResearchedContent(agent, platform as Platform, researchResults);

        // Check if needs review
        if (generated.needsReview) {
          await query(
            `UPDATE agent_actions SET status = 'review', content_text = $1,
             guardrail_score = $2, guardrail_notes = $3 WHERE id = $4`,
            [generated.text, generated.guardrailScore, generated.flaggedTerms.join(', '), action_id],
          );
          console.log(`[Research] Action ${action_id} sent to review (score: ${generated.guardrailScore})`);
          return;
        }

        // --- Phase 3: Post to platform ---
        let result: { id: string; url: string };

        switch (platform) {
          case 'twitter':
            result = await postToTwitter(token, generated.text);
            break;

          case 'reddit': {
            const subreddit = agent.subreddit_targets[Math.floor(Math.random() * agent.subreddit_targets.length)] || 'test';
            const lines = generated.text.split('\n');
            const title = lines[0].substring(0, 100);
            const body = lines.slice(1).join('\n') || generated.text;
            result = await postToReddit(token, subreddit, title, body);
            break;
          }

          default:
            throw new Error(`Posting to ${platform} not yet implemented`);
        }

        // Update action as published
        await query(
          `UPDATE agent_actions SET status = 'published', content_text = $1,
           platform_post_id = $2, platform_url = $3, executed_at = now(),
           guardrail_score = $4 WHERE id = $5`,
          [generated.text, result.id, result.url, generated.guardrailScore, action_id],
        );

        // Update agent stats
        await query(
          `UPDATE agents SET posts_made = posts_made + 1, last_active_at = now() WHERE id = $1`,
          [agent_id],
        );

        console.log(`[Research] Published research post to ${platform}: ${result.url}`);

      } catch (err: any) {
        console.error(`[Research] Failed action ${action_id}:`, err.message);

        await query(
          `UPDATE agent_actions SET status = 'failed', error_message = $1,
           retry_count = retry_count + 1, executed_at = now() WHERE id = $2`,
          [err.message, action_id],
        );

        throw err; // Let BullMQ handle retry
      }
    },
    {
      connection: redis,
      concurrency: 2,
      limiter: { max: 3, duration: 60_000 }, // max 3 research posts per minute
    },
  );

  console.log('[Research Processor] Started');
  return worker;
}
