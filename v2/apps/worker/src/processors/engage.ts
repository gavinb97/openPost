// ============================================================
// Engage Processor — Likes, Follows, Retweets, Subscribes
// ============================================================

import { Worker, type Job as BullJob } from 'bullmq';
import crypto from 'crypto';
import { redis } from '../queues';
import { query, queryOne } from '../db';
import { config } from '../config';
import { QUEUES } from '@onlyposts/shared';
import type { Agent, OAuthToken, PlatformAccount, EngageJobPayload } from '@onlyposts/shared';

async function getTokens(accountId: string) {
  const account = await queryOne<PlatformAccount>('SELECT * FROM platform_accounts WHERE id = $1', [accountId]);
  const token = await queryOne<OAuthToken>('SELECT * FROM oauth_tokens WHERE platform_account_id = $1', [accountId]);
  if (!account || !token) throw new Error(`Missing account/token for ${accountId}`);
  return { account, token };
}

export function startEngageProcessor() {
  const worker = new Worker<EngageJobPayload>(
    QUEUES.ENGAGE,
    async (job: BullJob<EngageJobPayload>) => {
      const { agent_id, platform_account_id, action_id, platform, action_type, target_post_id, target_user } = job.data;
      console.log(`[Engage] ${action_type} on ${platform} — action ${action_id}`);

      try {
        const { account, token } = await getTokens(platform_account_id);

        switch (platform) {
          case 'twitter': {
            const OAuth = (await import('oauth-1.0a')).default;
            const oauth = new OAuth({
              consumer: { key: config.twitter.appKey, secret: config.twitter.appSecret },
              signature_method: 'HMAC-SHA1',
              hash_function(bs: string, k: string) { return crypto.createHmac('sha1', k).update(bs).digest('base64'); },
            });
            const tok = { key: token.access_token, secret: token.token_secret! };

            if (action_type === 'like' && target_post_id) {
              const url = `https://api.twitter.com/2/users/${account.platform_user_id}/likes`;
              const header = oauth.toHeader(oauth.authorize({ url, method: 'POST' }, tok));
              await fetch(url, {
                method: 'POST',
                headers: { ...header, 'Content-Type': 'application/json' },
                body: JSON.stringify({ tweet_id: target_post_id }),
              });
            } else if (action_type === 'follow' && target_user) {
              const url = `https://api.twitter.com/2/users/${account.platform_user_id}/following`;
              const header = oauth.toHeader(oauth.authorize({ url, method: 'POST' }, tok));
              await fetch(url, {
                method: 'POST',
                headers: { ...header, 'Content-Type': 'application/json' },
                body: JSON.stringify({ target_user_id: target_user }),
              });
            } else if (action_type === 'retweet' && target_post_id) {
              const url = `https://api.twitter.com/2/users/${account.platform_user_id}/retweets`;
              const header = oauth.toHeader(oauth.authorize({ url, method: 'POST' }, tok));
              await fetch(url, {
                method: 'POST',
                headers: { ...header, 'Content-Type': 'application/json' },
                body: JSON.stringify({ tweet_id: target_post_id }),
              });
            }
            break;
          }

          case 'reddit': {
            if (action_type === 'like' && target_post_id) {
              await fetch('https://oauth.reddit.com/api/vote', {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${token.access_token}`,
                  'User-Agent': config.reddit.userAgent,
                  'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({ id: target_post_id, dir: '1' }),
              });
            } else if (action_type === 'subscribe' && target_user) {
              await fetch('https://oauth.reddit.com/api/subscribe', {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${token.access_token}`,
                  'User-Agent': config.reddit.userAgent,
                  'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({ action: 'sub', sr_name: target_user }),
              });
            }
            break;
          }

          case 'youtube': {
            if (action_type === 'like' && target_post_id) {
              await fetch(`https://www.googleapis.com/youtube/v3/videos/rate?id=${target_post_id}&rating=like`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token.access_token}` },
              });
            } else if (action_type === 'subscribe' && target_user) {
              await fetch('https://www.googleapis.com/youtube/v3/subscriptions?part=snippet', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token.access_token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ snippet: { resourceId: { kind: 'youtube#channel', channelId: target_user } } }),
              });
            }
            break;
          }
        }

        // Update action as published
        await query(
          `UPDATE agent_actions SET status = 'published', executed_at = now() WHERE id = $1`,
          [action_id],
        );

        // Update agent stats
        const statField = action_type === 'like' ? 'likes_given' : action_type === 'follow' || action_type === 'subscribe' ? 'follows_made' : null;
        if (statField) {
          await query(`UPDATE agents SET ${statField} = ${statField} + 1, last_active_at = now() WHERE id = $1`, [agent_id]);
        }

        console.log(`[Engage] ${action_type} completed on ${platform}`);

      } catch (err: any) {
        console.error(`[Engage] Failed action ${action_id}:`, err.message);
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
      concurrency: 3,
      limiter: { max: 10, duration: 60_000 },
    },
  );

  console.log('[Engage Processor] Started');
  return worker;
}
