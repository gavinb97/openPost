// ============================================================
// Post Processor — Handles post creation across platforms
// ============================================================

import { Worker, type Job as BullJob } from 'bullmq';
import { redis } from '../queues';
import { query, queryOne } from '../db';
import { generatePostContent } from '../ai';
import { updateConversationMemory } from '../ai';
import { QUEUES } from '@onlyposts/shared';
import type { Agent, OAuthToken, PlatformAccount, PostJobPayload, Platform } from '@onlyposts/shared';

// Platform service imports (shared logic with API)
import crypto from 'crypto';
import { config } from '../config';

// ============================================================
// Inline platform helpers (to avoid circular deps with API)
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
      'User-Agent': config.reddit.userAgent,
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
// PROCESSOR
// ============================================================

export function startPostProcessor() {
  const worker = new Worker<PostJobPayload>(
    QUEUES.POST,
    async (job: BullJob<PostJobPayload>) => {
      const { agent_id, platform_account_id, action_id, platform } = job.data;
      console.log(`[Post] Processing action ${action_id} for ${platform}`);

      try {
        // Get agent and account
        const agent = await queryOne<Agent>('SELECT * FROM agents WHERE id = $1', [agent_id]);
        if (!agent) throw new Error(`Agent ${agent_id} not found`);
        const { account, token } = await getTokens(platform_account_id);

        // Generate content
        const generated = await generatePostContent(agent, platform as Platform);

        // Check if needs review
        if (generated.needsReview) {
          await query(
            `UPDATE agent_actions SET status = 'review', content_text = $1,
             guardrail_score = $2, guardrail_notes = $3 WHERE id = $4`,
            [generated.text, generated.guardrailScore, generated.flaggedTerms.join(', '), action_id],
          );
          console.log(`[Post] Action ${action_id} sent to review (score: ${generated.guardrailScore})`);
          return;
        }

        // Post to platform
        let result: { id: string; url: string };

        switch (platform) {
          case 'twitter':
            result = await postToTwitter(token, generated.text);
            break;

          case 'reddit': {
            // Pick a subreddit
            const subreddit = agent.subreddit_targets[Math.floor(Math.random() * agent.subreddit_targets.length)] || 'test';
            // Split: first line = title, rest = body
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

        console.log(`[Post] Published to ${platform}: ${result.url}`);

      } catch (err: any) {
        console.error(`[Post] Failed action ${action_id}:`, err.message);

        // Update action as failed
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
      concurrency: 3,
      limiter: { max: 5, duration: 60_000 }, // max 5 posts per minute
    },
  );

  console.log('[Post Processor] Started');
  return worker;
}
