// ============================================================
// Reply Processor — Handles replies/comments across platforms
// ============================================================

import { Worker, type Job as BullJob } from 'bullmq';
import crypto from 'crypto';
import { redis } from './queues';
import { query, queryOne } from './db';
import { generateReplyContent, updateConversationMemory } from './ai';
import { config } from './config';
import { QUEUES } from '@onlyposts/shared';
import type { Agent, OAuthToken, PlatformAccount, ReplyJobPayload, Platform, AgentConversation } from '@onlyposts/shared';

async function getTokens(accountId: string) {
  const account = await queryOne<PlatformAccount>('SELECT * FROM platform_accounts WHERE id = $1', [accountId]);
  const token = await queryOne<OAuthToken>('SELECT * FROM oauth_tokens WHERE platform_account_id = $1', [accountId]);
  if (!account || !token) throw new Error(`Missing account/token for ${accountId}`);
  return { account, token };
}

export function startReplyProcessor() {
  const worker = new Worker<ReplyJobPayload>(
    QUEUES.REPLY,
    async (job: BullJob<ReplyJobPayload>) => {
      const { agent_id, platform_account_id, action_id, platform, target_post_id, target_user } = job.data;
      console.log(`[Reply] Processing action ${action_id} for ${platform}`);

      try {
        const agent = await queryOne<Agent>('SELECT * FROM agents WHERE id = $1', [agent_id]);
        if (!agent) throw new Error(`Agent ${agent_id} not found`);
        const { account, token } = await getTokens(platform_account_id);

        // Get conversation context
        const conversation = target_user
          ? await queryOne<AgentConversation>(
              'SELECT * FROM agent_conversations WHERE agent_id = $1 AND platform = $2 AND target_user = $3',
              [agent_id, platform, target_user],
            )
          : null;

        // For Reddit: scrape the target post/comment to get context
        let originalContent = 'An interesting social media post';
        if (platform === 'reddit' && job.data.target_post_id) {
          // Fetch post content
          try {
            const resp = await fetch(`https://oauth.reddit.com/api/info?id=${target_post_id}`, {
              headers: {
                Authorization: `Bearer ${token.access_token}`,
                'User-Agent': config.reddit.userAgent,
              },
            });
            const data = await resp.json() as any;
            const post = data?.data?.children?.[0]?.data;
            if (post) originalContent = `${post.title}\n\n${post.selftext || ''}`.trim();
          } catch { /* use default */ }
        }

        // Generate reply
        const generated = await generateReplyContent(agent, platform as Platform, originalContent, conversation);

        if (generated.needsReview) {
          await query(
            `UPDATE agent_actions SET status = 'review', content_text = $1,
             guardrail_score = $2, guardrail_notes = $3 WHERE id = $4`,
            [generated.text, generated.guardrailScore, generated.flaggedTerms.join(', '), action_id],
          );
          return;
        }

        // Post reply
        let resultId = '';
        let resultUrl = '';

        switch (platform) {
          case 'twitter': {
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
              body: JSON.stringify({ text: generated.text, reply: { in_reply_to_tweet_id: target_post_id } }),
            });
            const data = await resp.json() as any;
            if (!resp.ok) throw new Error(`Twitter reply failed: ${JSON.stringify(data)}`);
            resultId = data.data.id;
            resultUrl = `https://twitter.com/i/status/${resultId}`;
            break;
          }

          case 'reddit': {
            const resp = await fetch('https://oauth.reddit.com/api/comment', {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${token.access_token}`,
                'User-Agent': config.reddit.userAgent,
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: new URLSearchParams({ api_type: 'json', thing_id: target_post_id || '', text: generated.text }),
            });
            const data = await resp.json() as any;
            resultId = data?.json?.data?.things?.[0]?.data?.id || '';
            break;
          }

          case 'youtube': {
            const resp = await fetch('https://www.googleapis.com/youtube/v3/commentThreads?part=snippet', {
              method: 'POST',
              headers: { Authorization: `Bearer ${token.access_token}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({
                snippet: { videoId: target_post_id, topLevelComment: { snippet: { textOriginal: generated.text } } },
              }),
            });
            const data = await resp.json() as any;
            resultId = data?.id || '';
            break;
          }

          default:
            throw new Error(`Reply not implemented for ${platform}`);
        }

        // Update action
        await query(
          `UPDATE agent_actions SET status = 'published', content_text = $1,
           platform_post_id = $2, platform_url = $3, executed_at = now(),
           guardrail_score = $4 WHERE id = $5`,
          [generated.text, resultId, resultUrl, generated.guardrailScore, action_id],
        );

        // Update stats
        await query('UPDATE agents SET replies_sent = replies_sent + 1, last_active_at = now() WHERE id = $1', [agent_id]);

        // Update conversation memory
        if (target_user) {
          await updateConversationMemory(agent_id, platform as Platform, platform_account_id, target_user, 'agent', generated.text);
        }

        console.log(`[Reply] Published reply on ${platform}: ${resultId}`);

      } catch (err: any) {
        console.error(`[Reply] Failed action ${action_id}:`, err.message);
        await query(
          `UPDATE agent_actions SET status = 'failed', error_message = $1,
           retry_count = retry_count + 1, executed_at = now() WHERE id = $2`,
          [err.message, action_id],
        );
        throw err;
      }
    },
    {
      connection: redis,
      concurrency: 2,
      limiter: { max: 3, duration: 60_000 },
    },
  );

  console.log('[Reply Processor] Started');
  return worker;
}
