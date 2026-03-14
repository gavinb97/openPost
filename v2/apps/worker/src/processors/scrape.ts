// ============================================================
// Scrape Processor — Gathers targets from communities
// ============================================================

import { Worker, type Job as BullJob } from 'bullmq';
import { redis } from '../queues';
import { query, queryOne } from '../db';
import { config } from '../config';
import { QUEUES } from '@onlyposts/shared';
import type { OAuthToken, PlatformAccount, ScrapeJobPayload } from '@onlyposts/shared';

async function getTokens(accountId: string) {
  const account = await queryOne<PlatformAccount>('SELECT * FROM platform_accounts WHERE id = $1', [accountId]);
  const token = await queryOne<OAuthToken>('SELECT * FROM oauth_tokens WHERE platform_account_id = $1', [accountId]);
  if (!account || !token) throw new Error(`Missing account/token for ${accountId}`);
  return { account, token };
}

export function startScrapeProcessor() {
  const worker = new Worker<ScrapeJobPayload>(
    QUEUES.SCRAPE,
    async (job: BullJob<ScrapeJobPayload>) => {
      const { agent_id, platform, community, user_id } = job.data;
      console.log(`[Scrape] Scraping ${community} on ${platform}`);

      try {
        const users: string[] = [];

        switch (platform) {
          case 'reddit': {
            // Find a Reddit account for the user
            const account = await queryOne<PlatformAccount>(
              `SELECT * FROM platform_accounts WHERE user_id = $1 AND platform = 'reddit' LIMIT 1`,
              [user_id],
            );
            if (!account) throw new Error('No Reddit account connected');
            const token = await queryOne<OAuthToken>(
              'SELECT * FROM oauth_tokens WHERE platform_account_id = $1',
              [account.id],
            );
            if (!token) throw new Error('No Reddit token found');

            // Scrape new posts
            const resp = await fetch(`https://oauth.reddit.com/r/${community}/new.json?limit=100`, {
              headers: {
                Authorization: `Bearer ${token.access_token}`,
                'User-Agent': config.reddit.userAgent,
              },
            });
            const data = await resp.json() as any;
            const posts = data?.data?.children || [];

            for (const child of posts) {
              const author = child.data?.author;
              if (author && author !== '[deleted]' && author !== 'AutoModerator') {
                users.push(author);
              }
            }

            // Also get commenters from top posts
            const hotResp = await fetch(`https://oauth.reddit.com/r/${community}/hot.json?limit=10`, {
              headers: {
                Authorization: `Bearer ${token.access_token}`,
                'User-Agent': config.reddit.userAgent,
              },
            });
            const hotData = await hotResp.json() as any;
            const hotPosts = hotData?.data?.children || [];

            for (const post of hotPosts.slice(0, 3)) {
              const postId = post.data?.id;
              if (!postId) continue;

              const commentsResp = await fetch(
                `https://oauth.reddit.com/r/${community}/comments/${postId}.json?limit=50`,
                {
                  headers: {
                    Authorization: `Bearer ${token.access_token}`,
                    'User-Agent': config.reddit.userAgent,
                  },
                },
              );
              const commentsData = await commentsResp.json() as any;
              const comments = commentsData?.[1]?.data?.children || [];

              for (const comment of comments) {
                const author = comment.data?.author;
                if (author && author !== '[deleted]' && author !== 'AutoModerator') {
                  users.push(author);
                }
              }

              // Rate limit: wait between requests
              await new Promise((r) => setTimeout(r, 2000));
            }
            break;
          }

          case 'twitter': {
            // Twitter search for users in a topic/hashtag
            const account = await queryOne<PlatformAccount>(
              `SELECT * FROM platform_accounts WHERE user_id = $1 AND platform = 'twitter' LIMIT 1`,
              [user_id],
            );
            if (!account) throw new Error('No Twitter account connected');
            const token = await queryOne<OAuthToken>(
              'SELECT * FROM oauth_tokens WHERE platform_account_id = $1',
              [account.id],
            );
            if (!token) throw new Error('No Twitter token found');

            // This would use Twitter search API - limited in free tier
            console.log(`[Scrape] Twitter scraping for "${community}" — limited in free tier`);
            break;
          }

          default:
            console.log(`[Scrape] Scraping not implemented for ${platform}`);
        }

        // Deduplicate
        const uniqueUsers = [...new Set(users)];
        console.log(`[Scrape] Found ${uniqueUsers.length} unique users in ${community}`);

        // Insert DM targets (ON CONFLICT ignore duplicates)
        if (uniqueUsers.length > 0 && agent_id) {
          const insertValues = uniqueUsers.map(
            (u, i) => `($${i * 5 + 1}, $${i * 5 + 2}, $${i * 5 + 3}, $${i * 5 + 4}, $${i * 5 + 5})`,
          ).join(', ');

          const insertParams = uniqueUsers.flatMap((u) => [user_id, agent_id, platform, u, community]);

          await query(
            `INSERT INTO dm_targets (user_id, agent_id, platform, target_username, source_community)
             VALUES ${insertValues}
             ON CONFLICT (user_id, platform, target_username) DO NOTHING`,
            insertParams,
          );
        }

        // Update scraped communities table
        await query(
          `INSERT INTO scraped_communities (user_id, platform, community_name, active_posters, last_scraped_at)
           VALUES ($1, $2, $3, $4, now())
           ON CONFLICT (user_id, platform, community_name)
           DO UPDATE SET active_posters = $4, last_scraped_at = now()`,
          [user_id, platform, community, uniqueUsers.slice(0, 500)],
        );

        console.log(`[Scrape] Saved ${uniqueUsers.length} targets from ${community}`);

      } catch (err: any) {
        console.error(`[Scrape] Failed:`, err.message);
        throw err;
      }
    },
    {
      connection: redis,
      concurrency: 1,
      limiter: { max: 1, duration: 30_000 }, // Max 1 scrape per 30 seconds
    },
  );

  console.log('[Scrape Processor] Started');
  return worker;
}
