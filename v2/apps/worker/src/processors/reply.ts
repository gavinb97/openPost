// ============================================================
// Reply Processor — Handles replies/comments across platforms
// ============================================================

import { Worker, type Job as BullJob } from 'bullmq';
import crypto from 'crypto';
import { redis } from '../queues';
import { query, queryOne } from '../db';
import { generateReplyContent, updateConversationMemory } from '../ai';
import { config } from '../config';
import { QUEUES } from '@onlyposts/shared';
import type { Agent, OAuthToken, PlatformAccount, ReplyJobPayload, Platform, AgentConversation } from '@onlyposts/shared';

async function getTokens(accountId: string) {
  const account = await queryOne<PlatformAccount>('SELECT * FROM platform_accounts WHERE id = $1', [accountId]);
  const token = await queryOne<OAuthToken>('SELECT * FROM oauth_tokens WHERE platform_account_id = $1', [accountId]);
  if (!account || !token) throw new Error(`Missing account/token for ${accountId}`);
  return { account, token };
}

// ============================================================
// Twitter: find a tweet to reply to
//
// Strategy (in order):
//   1. Mentions        (v2) — free tier, always replyable (author engaged with us)
//   2. Recent search   (v2) — requires Basic tier ($100/mo), skipped on 403
//   3. Home timeline   (v2) — free tier, filtered to reply_settings=everyone
//
// Note: replying to arbitrary tweets fails with 403 if the account has not been
// mentioned or previously engaged by the author. Mentions are the only guaranteed
// replyable source on the free tier.
// ============================================================

async function makeOAuthHeader(
  token: OAuthToken,
  method: string,
  url: string,
): Promise<Record<string, string>> {
  const OAuth = (await import('oauth-1.0a')).default;
  const oauth = new OAuth({
    consumer: { key: config.twitter.appKey, secret: config.twitter.appSecret },
    signature_method: 'HMAC-SHA1',
    hash_function(bs: string, k: string) { return crypto.createHmac('sha1', k).update(bs).digest('base64'); },
  });
  const tok = { key: token.access_token, secret: token.token_secret! };
  return oauth.toHeader(oauth.authorize({ url, method }, tok)) as unknown as Record<string, string>;
}

async function findTweetToReply(
  token: OAuthToken,
  account: PlatformAccount,
  keywords: string[],
  hashtags: string[],
  usedTweetIds: Set<string>,
): Promise<{ id: string; text: string; author_id: string } | null> {
  const terms = [
    ...hashtags.slice(0, 3).map((h) => h.startsWith('#') ? h : `#${h}`),
    ...keywords.slice(0, 3),
  ].filter(Boolean);

  console.log(`[Reply] Searching for tweets to reply to. Terms: ${terms.join(', ') || '(none)'}, excluding ${usedTweetIds.size} already-used tweet(s)`);

  // Only reply to tweets not already targeted and not from self
  const isEligible = (t: any) =>
    t.author_id !== account.platform_user_id && !usedTweetIds.has(t.id);

  // Only reply to tweets open to everyone (for non-mention sources)
  const isReplyable = (t: any) =>
    isEligible(t) && (!t.reply_settings || t.reply_settings === 'everyone');

  // ── Strategy 1: mentions (free tier, always replyable) ──
  // Tweets that mention the agent can always be replied to.
  if (account.platform_user_id) {
    try {
      const mentionsUrl = `https://api.twitter.com/2/users/${account.platform_user_id}/mentions?tweet.fields=id,text,author_id&max_results=10&expansions=author_id`;
      const header = await makeOAuthHeader(token, 'GET', mentionsUrl);
      const resp = await fetch(mentionsUrl, { headers: header });
      const data = await resp.json() as any;

      if (resp.ok) {
        const mentions: any[] = data?.data || [];
        const eligible = mentions.filter(isEligible);
        if (eligible.length > 0) {
          console.log(`[Reply] Found ${eligible.length} mention(s) to reply to`);
          return eligible[0];
        }
        console.log(`[Reply] No new mentions found (${mentions.length} total, all already used)`);
      } else if (resp.status !== 403 && resp.status !== 401) {
        console.warn(`[Reply] Mentions API error (${resp.status}): ${JSON.stringify(data)}`);
      }
    } catch (err: any) {
      console.warn(`[Reply] Mentions fetch error: ${err.message}`);
    }
  }

  // ── Strategy 2: recent search (Basic tier+, skipped on 403) ──
  if (terms.length > 0) {
    const queryStr = `(${terms.join(' OR ')}) -is:reply -is:retweet lang:en`;
    const searchUrl = `https://api.twitter.com/2/tweets/search/recent?query=${encodeURIComponent(queryStr)}&tweet.fields=id,text,author_id,reply_settings&max_results=10`;
    try {
      const header = await makeOAuthHeader(token, 'GET', searchUrl);
      const resp = await fetch(searchUrl, { headers: header });
      const data = await resp.json() as any;

      if (resp.status === 403 || resp.status === 401) {
        console.log(`[Reply] Search API not available (${resp.status}) — falling back to home timeline`);
      } else if (!resp.ok) {
        console.warn(`[Reply] Twitter search failed (${resp.status}): ${JSON.stringify(data)}`);
      } else {
        const tweets: any[] = data?.data || [];
        const eligible = tweets.filter(isReplyable);
        if (eligible.length > 0) {
          console.log(`[Reply] Found ${eligible.length} replyable tweet(s) via search`);
          return eligible[0];
        }
        console.log(`[Reply] Search returned ${tweets.length} tweet(s) but none replyable (reply_settings filtered)`);
      }
    } catch (err: any) {
      console.warn(`[Reply] Twitter search error: ${err.message}`);
    }
  }

  // ── Strategy 3: home timeline (free tier, reply_settings=everyone only) ──
  // Only picks tweets that explicitly allow everyone to reply.
  if (!account.platform_user_id) {
    console.warn(`[Reply] No platform_user_id on account — cannot fetch home timeline`);
    return null;
  }
  try {
    const timelineUrl = `https://api.twitter.com/2/users/${account.platform_user_id}/timelines/reverse_chronological?tweet.fields=id,text,author_id,reply_settings&max_results=20&exclude=retweets,replies`;
    const header = await makeOAuthHeader(token, 'GET', timelineUrl);
    const resp = await fetch(timelineUrl, { headers: header });
    const data = await resp.json() as any;

    if (!resp.ok) {
      console.warn(`[Reply] Twitter home timeline failed (${resp.status}): ${JSON.stringify(data)}`);
      return null;
    }

    const tweets: any[] = data?.data || [];
    let eligible = tweets.filter(isReplyable);

    // Prefer keyword-relevant tweets if we have terms
    if (terms.length > 0) {
      const keywordFiltered = eligible.filter((t) =>
        terms.some((term) => t.text.toLowerCase().includes(term.replace('#', '').toLowerCase())),
      );
      if (keywordFiltered.length > 0) eligible = keywordFiltered;
    }

    if (eligible.length > 0) {
      console.log(`[Reply] Found ${eligible.length} replyable tweet(s) via home timeline`);
      return eligible[0];
    }

    console.log(`[Reply] Home timeline: ${tweets.length} tweet(s), none replyable (all restricted)`);
    return null;
  } catch (err: any) {
    console.warn(`[Reply] Twitter home timeline error: ${err.message}`);
    return null;
  }
}

// ============================================================
// Reddit: find a relevant post in target subreddit to reply to
// ============================================================

async function findRedditPostToReply(
  token: OAuthToken,
  subreddit: string,
  keywords: string[],
): Promise<{ id: string; fullname: string; title: string; selftext: string } | null> {
  try {
    // Search the subreddit for recent posts matching agent keywords
    const query = keywords.slice(0, 4).join(' ');
    const url = query
      ? `https://oauth.reddit.com/r/${subreddit}/search?q=${encodeURIComponent(query)}&restrict_sr=1&sort=new&t=week&limit=10`
      : `https://oauth.reddit.com/r/${subreddit}/hot?limit=10`;

    const resp = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token.access_token}`,
        'User-Agent': config.reddit.userAgent,
      },
    });
    const data = await resp.json() as any;

    if (!resp.ok) {
      console.warn(`[Reply] Reddit search failed (${resp.status}): ${JSON.stringify(data)}`);
      return null;
    }

    const posts: any[] = data?.data?.children ?? [];
    const eligible = posts.filter((p: any) => {
      const d = p.data;
      // Skip stickied/pinned, locked, or self-promotion
      return !d.stickied && !d.locked && d.author !== '[deleted]' && d.score > 0;
    });

    if (!eligible.length) return null;
    const post = eligible[0].data;
    return {
      id: post.id,
      fullname: post.name, // e.g. "t3_abc123" — needed for Reddit comment thing_id
      title: post.title,
      selftext: post.selftext || '',
    };
  } catch (err: any) {
    console.warn(`[Reply] Reddit search error: ${err.message}`);
    return null;
  }
}

// ============================================================
// PROCESSOR
// ============================================================

export function startReplyProcessor() {
  const worker = new Worker<ReplyJobPayload>(
    QUEUES.REPLY,
    async (job: BullJob<ReplyJobPayload>) => {
      const { agent_id, platform_account_id, action_id, platform } = job.data;
      console.log(`[Reply] Processing action ${action_id} for ${platform}`);

      try {
        const agent = await queryOne<Agent>('SELECT * FROM agents WHERE id = $1', [agent_id]);
        if (!agent) throw new Error(`Agent ${agent_id} not found`);
        const { account, token } = await getTokens(platform_account_id);

        // Load action record — need content_text, target_post_id, target_user from DB
        // (target_post_id may have been found and stored in a previous run or review step)
        const existingAction = await queryOne<any>(
          'SELECT content_text, target_post_id, target_user, target_subreddit FROM agent_actions WHERE id = $1',
          [action_id],
        );

        const preApprovedText = (job.data as any).override_content || existingAction?.content_text;
        // Prefer DB value — review approve jobData may not carry target_post_id
        let targetPostId: string | null = existingAction?.target_post_id || (job.data as any).target_post_id || null;
        const targetUser: string | null = existingAction?.target_user || (job.data as any).target_user || null;

        // ── For Twitter: find a tweet to reply to if we don't have one yet ──
        if (platform === 'twitter' && !targetPostId) {
          const keywords = [...(agent.topic_keywords ?? [])];
          const hashtags = [...(agent.hashtag_targets ?? [])];
          const usedRows = await query<{ target_post_id: string }>(
            `SELECT target_post_id FROM agent_actions
             WHERE agent_id = $1 AND action_type IN ('reply','comment')
             AND target_post_id IS NOT NULL`,
            [agent_id],
          );
          const usedTweetIds = new Set(usedRows.map((r) => r.target_post_id));
          const found = await findTweetToReply(token, account, keywords, hashtags, usedTweetIds);
          if (found) {
            targetPostId = found.id;
            await query(`UPDATE agent_actions SET target_post_id = $1 WHERE id = $2`, [targetPostId, action_id]);
            console.log(`[Reply] Found target tweet ${targetPostId}: "${found.text.substring(0, 80)}..."`);
          } else {
            console.warn(`[Reply] No tweet found to reply to — skipping action`);
            await query(
              `UPDATE agent_actions SET status = 'failed', error_message = 'No suitable tweet found to reply to (search + home timeline both empty)', executed_at = now() WHERE id = $1`,
              [action_id],
            );
            return;
          }
        }

        // ── For Reddit: find a post in the target subreddit if we don't have one yet ──
        let redditPostContent: string | null = null;
        if (platform === 'reddit' && !targetPostId) {
          const subreddit = existingAction?.target_subreddit || (job.data as any).target_subreddit;
          if (subreddit) {
            const found = await findRedditPostToReply(token, subreddit, agent.topic_keywords ?? []);
            if (found) {
              targetPostId = found.fullname; // Reddit thing_id (e.g. "t3_abc123")
              redditPostContent = `${found.title}\n\n${found.selftext}`.trim();
              await query(
                `UPDATE agent_actions SET target_post_id = $1 WHERE id = $2`,
                [targetPostId, action_id],
              );
              console.log(`[Reply] Found Reddit post ${targetPostId}: "${found.title.substring(0, 80)}"`);
            } else {
              console.log(`[Reply] No Reddit post found in r/${subreddit} — skipping`);
              await query(
                `UPDATE agent_actions SET status = 'failed', error_message = 'No suitable Reddit post found to reply to', executed_at = now() WHERE id = $1`,
                [action_id],
              );
              return;
            }
          }
        }

        let replyText: string;
        let originalContent = 'An interesting social media post';

        if (preApprovedText) {
          replyText = preApprovedText;
          console.log(`[Reply] Action ${action_id} using pre-approved content`);
        } else {
          // Get conversation context
          const conversation = targetUser
            ? await queryOne<AgentConversation>(
                'SELECT * FROM agent_conversations WHERE agent_id = $1 AND platform = $2 AND target_user = $3',
                [agent_id, platform, targetUser],
              )
            : null;

          // For Reddit: use already-fetched content or re-fetch if we had a pre-existing target_post_id
          if (platform === 'reddit' && targetPostId) {
            if (redditPostContent) {
              originalContent = redditPostContent;
            } else {
              try {
                const resp = await fetch(`https://oauth.reddit.com/api/info?id=${targetPostId}`, {
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
          }

          const generated = await generateReplyContent(agent, platform as Platform, originalContent, conversation);

          if (generated.needsReview || agent.approval_mode === 'review') {
            await query(
              `UPDATE agent_actions SET status = 'review', content_text = $1,
               guardrail_score = $2, guardrail_notes = $3 WHERE id = $4`,
              [generated.text, generated.guardrailScore, generated.flaggedTerms.join(', '), action_id],
            );
            console.log(`[Reply] Action ${action_id} sent to review (score: ${generated.guardrailScore})`);
            return;
          }
          replyText = generated.text;
        }

        // ── Post reply ──
        let resultId = '';
        let resultUrl = '';

        switch (platform) {
          case 'twitter': {
            const tweetUrl = 'https://api.twitter.com/2/tweets';

            const h = await makeOAuthHeader(token, 'POST', tweetUrl);
            const tweetBody: Record<string, any> = { text: replyText };
            // Use quote_tweet_id instead of reply — avoids the "not engaged with author" 403
            // that Twitter enforces on the API even for tweets publicly open to replies.
            // Quote tweets are always allowed and more visible (appear in followers' feeds).
            if (targetPostId) tweetBody.quote_tweet_id = targetPostId;
            const resp = await fetch(tweetUrl, {
              method: 'POST',
              headers: { ...h, 'Content-Type': 'application/json' },
              body: JSON.stringify(tweetBody),
            });
            const data = await resp.json() as any;
            if (!resp.ok) throw new Error(`Twitter post failed: ${JSON.stringify(data)}`);
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
              body: new URLSearchParams({ api_type: 'json', thing_id: targetPostId || '', text: replyText }),
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
                snippet: { videoId: targetPostId, topLevelComment: { snippet: { textOriginal: replyText } } },
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
           platform_post_id = $2, platform_url = $3, executed_at = now() WHERE id = $4`,
          [replyText, resultId, resultUrl, action_id],
        );

        await query('UPDATE agents SET replies_sent = replies_sent + 1, last_active_at = now() WHERE id = $1', [agent_id]);

        if (targetUser) {
          await updateConversationMemory(agent_id, platform as Platform, platform_account_id, targetUser, 'agent', replyText);
        }

        console.log(`[Reply] Published reply on ${platform}: ${resultId}${targetPostId ? ` (reply to ${targetPostId})` : ''}`);

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
