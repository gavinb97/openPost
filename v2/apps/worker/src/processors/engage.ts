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

async function makeOAuthHeader(token: OAuthToken, method: string, url: string): Promise<Record<string, string>> {
  const OAuth = (await import('oauth-1.0a')).default;
  const oauth = new OAuth({
    consumer: { key: config.twitter.appKey, secret: config.twitter.appSecret },
    signature_method: 'HMAC-SHA1',
    hash_function(bs: string, k: string) { return crypto.createHmac('sha1', k).update(bs).digest('base64'); },
  });
  const tok = { key: token.access_token, secret: token.token_secret! };
  return oauth.toHeader(oauth.authorize({ url, method }, tok)) as unknown as Record<string, string>;
}

// Find a tweet to like/retweet — tries search API first, falls back to home timeline
async function findTweetForEngagement(
  token: OAuthToken,
  account: PlatformAccount,
  agent: Agent,
): Promise<{ id: string; text: string } | null> {
  const keywords = [...(agent.topic_keywords ?? []), ...(agent.hashtag_targets ?? [])].slice(0, 5);

  // Strategy 1: recent search (Basic tier+)
  if (keywords.length > 0) {
    const queryStr = `(${keywords.join(' OR ')}) -is:reply -is:retweet lang:en`;
    const searchUrl = `https://api.twitter.com/2/tweets/search/recent?query=${encodeURIComponent(queryStr)}&tweet.fields=id,text,author_id&max_results=10`;
    try {
      const header = await makeOAuthHeader(token, 'GET', searchUrl);
      const resp = await fetch(searchUrl, { headers: header });
      const data = await resp.json() as any;
      if (resp.ok) {
        const eligible = (data?.data ?? []).filter((t: any) => t.author_id !== account.platform_user_id);
        if (eligible.length > 0) {
          console.log(`[Engage] Found tweet via search for ${account.handle}`);
          return eligible[0];
        }
      } else if (resp.status !== 403 && resp.status !== 401) {
        console.warn(`[Engage] Search API error (${resp.status}): ${JSON.stringify(data)}`);
      }
    } catch { /* fall through */ }
  }

  // Strategy 2: home timeline (free tier)
  if (!account.platform_user_id) return null;
  try {
    const url = `https://api.twitter.com/2/users/${account.platform_user_id}/timelines/reverse_chronological?tweet.fields=id,text,author_id&max_results=20&exclude=retweets,replies`;
    const header = await makeOAuthHeader(token, 'GET', url);
    const resp = await fetch(url, { headers: header });
    const data = await resp.json() as any;
    if (!resp.ok) {
      console.warn(`[Engage] Home timeline error (${resp.status}): ${JSON.stringify(data)}`);
      return null;
    }
    let eligible: any[] = (data?.data ?? []).filter((t: any) => t.author_id !== account.platform_user_id);
    // Prefer keyword-relevant tweets
    if (keywords.length > 0) {
      const filtered = eligible.filter((t: any) =>
        keywords.some((k) => t.text.toLowerCase().includes(k.replace('#', '').toLowerCase())),
      );
      if (filtered.length > 0) eligible = filtered;
    }
    if (eligible.length > 0) {
      console.log(`[Engage] Found tweet via home timeline for ${account.handle}`);
      return eligible[0];
    }
  } catch { /* fall through */ }

  return null;
}

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

        // For retweet/like: find a target tweet if we don't have one yet
        let effectiveTargetPostId: string | null = target_post_id ?? null;

        if (platform === 'twitter' && (action_type === 'retweet' || action_type === 'like') && !effectiveTargetPostId) {
          const agent = await queryOne<Agent>('SELECT * FROM agents WHERE id = $1', [agent_id]);
          if (agent) {
            const found = await findTweetForEngagement(token, account, agent);
            if (found) {
              effectiveTargetPostId = found.id;
              // Persist target and, if review mode, hold for human approval
              if (agent.approval_mode === 'review') {
                await query(
                  `UPDATE agent_actions SET target_post_id = $1, status = 'review' WHERE id = $2`,
                  [effectiveTargetPostId, action_id],
                );
                console.log(`[Engage] ${action_type} sent to review — target tweet ${effectiveTargetPostId}`);
                return;
              }
              await query(`UPDATE agent_actions SET target_post_id = $1 WHERE id = $2`, [effectiveTargetPostId, action_id]);
            } else {
              console.warn(`[Engage] No tweet found to ${action_type} — skipping`);
              await query(
                `UPDATE agent_actions SET status = 'failed', error_message = $1, executed_at = now() WHERE id = $2`,
                [`No tweet found to ${action_type}`, action_id],
              );
              return;
            }
          }
        }

        switch (platform) {
          case 'twitter': {
            if (action_type === 'like' && effectiveTargetPostId) {
              const url = `https://api.twitter.com/2/users/${account.platform_user_id}/likes`;
              const header = await makeOAuthHeader(token, 'POST', url);
              await fetch(url, {
                method: 'POST',
                headers: { ...header, 'Content-Type': 'application/json' },
                body: JSON.stringify({ tweet_id: effectiveTargetPostId }),
              });
            } else if (action_type === 'follow' && target_user) {
              const url = `https://api.twitter.com/2/users/${account.platform_user_id}/following`;
              const header = await makeOAuthHeader(token, 'POST', url);
              await fetch(url, {
                method: 'POST',
                headers: { ...header, 'Content-Type': 'application/json' },
                body: JSON.stringify({ target_user_id: target_user }),
              });
            } else if (action_type === 'retweet' && effectiveTargetPostId) {
              const url = `https://api.twitter.com/2/users/${account.platform_user_id}/retweets`;
              const header = await makeOAuthHeader(token, 'POST', url);
              await fetch(url, {
                method: 'POST',
                headers: { ...header, 'Content-Type': 'application/json' },
                body: JSON.stringify({ tweet_id: effectiveTargetPostId }),
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
