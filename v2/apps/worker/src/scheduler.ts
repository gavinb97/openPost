// ============================================================
// Scheduler — Periodically creates jobs for enabled agents
// ============================================================

import { Worker, type Job as BullJob } from 'bullmq';
import { v4 as uuid } from 'uuid';
import { redis, postQueue, replyQueue, dmQueue, engageQueue, scrapeQueue, researchQueue } from './queues';
import { query, queryOne } from './db';
import { QUEUES, RATE_LIMITS } from '@onlyposts/shared';
import type { Agent, PlatformAccount, Platform } from '@onlyposts/shared';

/** Calculate next delay based on agent schedule config */
function getNextDelayMs(agent: Agent): number {
  const cfg = agent.schedule_config;

  switch (agent.schedule_type) {
    case 'random': {
      const minMs = (cfg.min_minutes || 30) * 60_000;
      const maxMs = (cfg.max_minutes || 480) * 60_000;
      return minMs + Math.random() * (maxMs - minMs);
    }
    case 'interval': {
      return (cfg.interval_minutes || 60) * 60_000;
    }
    case 'cron':
    case 'set_times':
      // For cron/set_times, we use BullMQ repeat instead
      return 0;
    default:
      return 60 * 60_000; // 1 hour fallback
  }
}

/** Pick a random platform account from the agent's list */
async function pickAccount(agent: Agent): Promise<PlatformAccount | null> {
  if (agent.platform_account_ids.length === 0) return null;

  // Rotate through accounts
  const randomIdx = Math.floor(Math.random() * agent.platform_account_ids.length);
  const accountId = agent.platform_account_ids[randomIdx];

  return queryOne<PlatformAccount>(
    'SELECT * FROM platform_accounts WHERE id = $1',
    [accountId],
  );
}

/** Pick next media from the depleting pool */
async function pickMedia(agent: Agent): Promise<string | null> {
  if (agent.remaining_media.length === 0 && agent.media_pool_ids.length === 0) return null;

  let remaining = [...agent.remaining_media];
  if (remaining.length === 0) {
    // Replenish from original pool
    remaining = [...agent.media_pool_ids];
  }

  const mediaId = remaining.shift()!;

  // Update remaining in DB
  await query(
    'UPDATE agents SET remaining_media = $1 WHERE id = $2',
    [remaining, agent.id],
  );

  return mediaId;
}

/** Check Redis rate limit before scheduling */
async function checkRateLimit(platform: Platform, accountId: string, actionType: string): Promise<boolean> {
  const key = `prl:${platform}:${accountId}:${actionType}`;
  const now = Date.now();
  const dayAgo = now - 86_400_000;

  // Count actions in last 24h
  await redis.zremrangebyscore(key, 0, dayAgo);
  const count = await redis.zcard(key);

  const limits = RATE_LIMITS[platform];
  const limitKey = `${actionType}s_per_day` as keyof typeof limits;
  const limit = limits[limitKey] as number || 100;

  return count < limit;
}

/** Record an action for rate limiting */
async function recordAction(platform: string, accountId: string, actionType: string): Promise<void> {
  const key = `prl:${platform}:${accountId}:${actionType}`;
  const now = Date.now();
  await redis.zadd(key, now.toString(), `${now}:${Math.random()}`);
  await redis.expire(key, 86_400);
}

/** Create an agent_action record and enqueue the job */
async function scheduleAction(
  agent: Agent,
  account: PlatformAccount,
  actionType: string,
  extra: Record<string, any> = {},
) {
  // Check rate limit
  const allowed = await checkRateLimit(account.platform, account.id, actionType);
  if (!allowed) {
    console.log(`[Scheduler] Rate limit reached for ${account.platform}:${account.handle}:${actionType}`);
    return;
  }

  // Create action record
  const [action] = await query<any>(
    `INSERT INTO agent_actions (
      agent_id, platform_account_id, action_type, status,
      target_post_id, target_user, target_subreddit, scheduled_at
    ) VALUES ($1, $2, $3, 'queued', $4, $5, $6, now())
    RETURNING *`,
    [
      agent.id, account.id, actionType,
      extra.target_post_id || null,
      extra.target_user || null,
      extra.target_subreddit || null,
    ],
  );

  const delayMs = getNextDelayMs(agent);
  const jobData = {
    agent_id: agent.id,
    platform_account_id: account.id,
    action_id: action.id,
    platform: account.platform,
    ...extra,
  };

  // Route to appropriate queue
  switch (actionType) {
    case 'post':
      await postQueue.add(`post:${action.id}`, jobData, { delay: delayMs, attempts: 3, backoff: { type: 'exponential', delay: 30_000 } });
      break;
    case 'reply':
    case 'comment':
      await replyQueue.add(`reply:${action.id}`, jobData, { delay: delayMs, attempts: 3, backoff: { type: 'exponential', delay: 30_000 } });
      break;
    case 'dm':
      await dmQueue.add(`dm:${action.id}`, jobData, { delay: delayMs, attempts: 2, backoff: { type: 'exponential', delay: 60_000 } });
      break;
    case 'like':
    case 'follow':
    case 'retweet':
    case 'subscribe':
      await engageQueue.add(`engage:${action.id}`, jobData, { delay: delayMs, attempts: 2 });
      break;
    case 'scrape':
      await scrapeQueue.add(`scrape:${action.id}`, jobData, { delay: 0, attempts: 2 });
      break;
    case 'research_post':
      await researchQueue.add(`research:${action.id}`, jobData, { delay: delayMs, attempts: 3, backoff: { type: 'exponential', delay: 30_000 } });
      break;
  }

  await recordAction(account.platform, account.id, actionType);
  console.log(`[Scheduler] Scheduled ${actionType} for agent "${agent.name}" → ${account.handle} (delay: ${Math.round(delayMs / 1000)}s)`);
}

/** Main scheduler tick — runs for each enabled agent */
async function schedulerTick() {
  const agents = await query<Agent>(
    'SELECT * FROM agents WHERE enabled = true',
  );

  console.log(`[Scheduler] Processing ${agents.length} active agents...`);

  for (const agent of agents) {
    try {
      const account = await pickAccount(agent);
      if (!account) {
        console.warn(`[Scheduler] Agent "${agent.name}" has no connected accounts`);
        continue;
      }

      // Schedule posts
      if (agent.auto_post) {
        await scheduleAction(agent, account, 'post', {
          media_file_id: await pickMedia(agent),
        });
      }

      // Schedule replies (need targets from scraping)
      if (agent.auto_reply || agent.auto_comment) {
        // Find recent unanswered content to reply to
        if (account.platform === 'reddit' && agent.subreddit_targets.length > 0) {
          const randomSub = agent.subreddit_targets[Math.floor(Math.random() * agent.subreddit_targets.length)];
          await scheduleAction(agent, account, 'reply', { target_subreddit: randomSub });
        }
      }

      // Schedule DMs
      if (agent.auto_dm) {
        // Get next unmessaged target
        const target = await queryOne<any>(
          `SELECT * FROM dm_targets
           WHERE agent_id = $1 AND platform = $2 AND messaged = false
           ORDER BY created_at LIMIT 1`,
          [agent.id, account.platform],
        );
        if (target) {
          await scheduleAction(agent, account, 'dm', { target_user: target.target_username });
        }
      }

      // Schedule engagement actions
      if (agent.auto_like) {
        await scheduleAction(agent, account, 'like');
      }
      if (agent.auto_follow) {
        await scheduleAction(agent, account, 'follow');
      }
      if (agent.auto_retweet && account.platform === 'twitter') {
        await scheduleAction(agent, account, 'retweet');
      }

      // Schedule research-powered posts
      if (agent.auto_web_research) {
        await scheduleAction(agent, account, 'research_post');
      }

      // Periodic scraping for subreddit targets
      if (agent.subreddit_targets.length > 0 && account.platform === 'reddit') {
        const randomSub = agent.subreddit_targets[Math.floor(Math.random() * agent.subreddit_targets.length)];
        await scheduleAction(agent, account, 'scrape', { target_subreddit: randomSub });
      }

      // Update last_active_at
      await query('UPDATE agents SET last_active_at = now() WHERE id = $1', [agent.id]);

    } catch (err: any) {
      console.error(`[Scheduler] Error processing agent "${agent.name}":`, err.message);
    }
  }
}

/** Start the scheduler worker */
export function startScheduler() {
  // Run scheduler every 5 minutes
  const worker = new Worker(
    QUEUES.SCHEDULER,
    async () => {
      await schedulerTick();
    },
    { connection: redis },
  );

  // Add repeating job
  schedulerQueue.add('tick', {}, {
    repeat: { every: 5 * 60_000 }, // every 5 minutes
    removeOnComplete: true,
    removeOnFail: 50,
  });

  console.log('[Scheduler] Started — ticking every 5 minutes');
  return worker;
}

// Export for direct use
import { schedulerQueue } from './queues';
