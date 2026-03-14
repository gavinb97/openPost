// ============================================================
// Scheduler — Fires enabled agents on their configured schedule
// ============================================================
//
// KEY DESIGN: Each scheduler tick checks `next_action_at` per agent.
// If it's in the future, skip. If it's null or past AND the agent has
// no pending jobs already queued, schedule the next batch and update
// next_action_at. This prevents the "job stacking" bug.

import { Worker } from 'bullmq';
import { redis, postQueue, replyQueue, dmQueue, engageQueue, scrapeQueue, researchQueue, schedulerQueue } from './queues';
import { query, queryOne } from './db';
import { QUEUES, RATE_LIMITS } from '@onlyposts/shared';
import type { Agent, PlatformAccount, Platform } from '@onlyposts/shared';

// ============================================================
// PEAK WINDOWS per platform (24h ET, day-of-week: 0=Sun)
// ============================================================
const PEAK_WINDOWS: Record<string, Array<{ days: number[]; startH: number; endH: number }>> = {
  twitter:   [{ days: [1,2,3,4,5], startH: 9,  endH: 10 }, { days: [1,2,3,4,5], startH: 12, endH: 13 }, { days: [1,2,3,4,5], startH: 15, endH: 16 }],
  reddit:    [{ days: [0,6],       startH: 8,  endH: 10 }, { days: [1,2,3,4,5], startH: 6,  endH: 8  }, { days: [5,6],       startH: 10, endH: 12 }],
  youtube:   [{ days: [4,5,6],     startH: 12, endH: 16 }, { days: [2,3],       startH: 14, endH: 17 }],
  tiktok:    [{ days: [1,2,3,4,5], startH: 7,  endH: 9  }, { days: [0,6],       startH: 11, endH: 13 }, { days: [0,6],       startH: 19, endH: 21 }],
  facebook:  [{ days: [2,3],       startH: 11, endH: 14 }, { days: [1,2,3,4],   startH: 9,  endH: 11 }],
  instagram: [{ days: [1,2,3,4,5], startH: 11, endH: 13 }, { days: [5,6],       startH: 10, endH: 12 }],
};

// ============================================================
// TIMEZONE HELPERS
// ============================================================

function addMs(d: Date, ms: number): Date { return new Date(d.getTime() + ms); }

function getLocalParts(tz: string): { hour: number; minute: number; dow: number } {
  const now = new Date();
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, hour: 'numeric', minute: 'numeric',
    weekday: 'short', hour12: false,
  });
  const parts = fmt.formatToParts(now);
  const hour = parseInt(parts.find(p => p.type === 'hour')?.value ?? '12');
  const minute = parseInt(parts.find(p => p.type === 'minute')?.value ?? '0');
  const dowStr = parts.find(p => p.type === 'weekday')?.value ?? 'Mon';
  const DOW: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return { hour, minute, dow: DOW[dowStr] ?? now.getDay() };
}

function minutesFromNow(mins: number): Date {
  return addMs(new Date(), mins * 60_000);
}

// ============================================================
// SCHEDULE CALCULATORS
// ============================================================

function getNextFireTime(agent: Agent): Date {
  const cfg = (agent.schedule_config ?? {}) as Record<string, any>;
  const tz: string = (agent as any).schedule_timezone ?? 'America/New_York';
  const now = new Date();

  switch (agent.schedule_type) {
    case 'random': {
      // Support both old field names (min_interval_minutes) and new (min_minutes)
      const min = (cfg.min_minutes ?? cfg.min_interval_minutes ?? 30);
      const max = (cfg.max_minutes ?? cfg.max_interval_minutes ?? 480);
      const delayMin = min + Math.random() * (max - min);
      return minutesFromNow(delayMin);
    }

    case 'interval': {
      return minutesFromNow(cfg.interval_minutes ?? 60);
    }

    case 'cron': {
      try { return nextCronTime(cfg.expression ?? '0 */2 * * *', tz); }
      catch { return minutesFromNow(120); }
    }

    case 'set_times': {
      const times: string[] = cfg.times ?? ['09:00', '12:00', '17:00'];
      const days: number[] = cfg.days ?? [1, 2, 3, 4, 5];
      return nextSetTime(times, days, tz);
    }

    case 'peak_hours': {
      const platform: string = cfg.platform ?? 'twitter';
      const windows = PEAK_WINDOWS[platform] ?? PEAK_WINDOWS.twitter;
      return nextPeakTime(windows, tz);
    }

    case 'burst': {
      const burstCount: number = cfg.burst_count ?? 3;
      const current: number = cfg._burst_current ?? 0;
      if (current < burstCount - 1) {
        return minutesFromNow(cfg.burst_interval_minutes ?? 15);
      } else {
        return minutesFromNow((cfg.cooldown_hours ?? 4) * 60);
      }
    }

    case 'business_hours': {
      return nextBusinessHoursTime(
        cfg.start_hour ?? 9,
        cfg.end_hour ?? 17,
        cfg.days ?? [1, 2, 3, 4, 5],
        cfg.interval_minutes ?? 90,
        tz,
      );
    }

    default:
      return minutesFromNow(60);
  }
}

function nextSetTime(times: string[], days: number[], tz: string): Date {
  const local = getLocalParts(tz);
  const now = new Date();
  const nowTotalMins = local.hour * 60 + local.minute;
  let best: Date | null = null;

  for (let dayOffset = 0; dayOffset < 8; dayOffset++) {
    const dow = (local.dow + dayOffset) % 7;
    if (!days.includes(dow)) continue;
    for (const t of times) {
      const [h, m] = t.split(':').map(Number);
      const totalMins = dayOffset * 24 * 60 + h * 60 + m - nowTotalMins;
      if (totalMins <= 1) continue;
      const candidate = addMs(now, totalMins * 60_000);
      if (!best || candidate < best) best = candidate;
    }
  }
  return best ?? minutesFromNow(1440);
}

function nextPeakTime(
  windows: Array<{ days: number[]; startH: number; endH: number }>,
  tz: string,
): Date {
  const local = getLocalParts(tz);
  const now = new Date();
  const nowTotalMins = local.hour * 60 + local.minute;
  let best: Date | null = null;

  for (const win of windows) {
    for (let dayOffset = 0; dayOffset < 8; dayOffset++) {
      const dow = (local.dow + dayOffset) % 7;
      if (!win.days.includes(dow)) continue;
      const windowMins = (win.endH - win.startH) * 60;
      const randomOffset = Math.floor(Math.random() * windowMins);
      const totalMins = dayOffset * 24 * 60 + win.startH * 60 + randomOffset - nowTotalMins;
      if (totalMins <= 1) continue;
      const candidate = addMs(now, totalMins * 60_000);
      if (!best || candidate < best) best = candidate;
    }
  }
  return best ?? minutesFromNow(120);
}

function nextBusinessHoursTime(
  startH: number, endH: number, workDays: number[], intervalMins: number, tz: string,
): Date {
  const local = getLocalParts(tz);
  const nowMins = local.hour * 60 + local.minute;

  // If right now is inside business hours on a work day, just add interval
  if (workDays.includes(local.dow) && local.hour >= startH && local.hour < endH) {
    const next = minutesFromNow(intervalMins);
    // Make sure next is still within business hours; if not, skip to next work day start
    const nextLocal = getLocalParts(tz); // re-read (approx)
    if (nextLocal.hour < endH) return next;
  }

  // Find next work day start
  const now = new Date();
  for (let offset = 1; offset <= 8; offset++) {
    const dow = (local.dow + offset) % 7;
    if (!workDays.includes(dow)) continue;
    const minsUntil = offset * 24 * 60 + startH * 60 - nowMins;
    return addMs(now, minsUntil * 60_000);
  }
  return minutesFromNow(1440);
}

function nextCronTime(expression: string, tz: string): Date {
  const [minPart, hourPart, , , dowPart] = expression.trim().split(/\s+/);
  const local = getLocalParts(tz);
  const nowTotalMins = local.hour * 60 + local.minute;
  const now = new Date();

  const expandPart = (part: string, max: number): number[] => {
    if (part === '*') return Array.from({ length: max }, (_, i) => i);
    if (part.startsWith('*/')) {
      const step = parseInt(part.slice(2));
      const r: number[] = [];
      for (let i = 0; i < max; i += step) r.push(i);
      return r;
    }
    if (part.includes('-')) {
      const [s, e] = part.split('-').map(Number);
      return Array.from({ length: e - s + 1 }, (_, i) => i + s);
    }
    return part.split(',').map(Number);
  };

  const hours = expandPart(hourPart, 24).sort((a, b) => a - b);
  const mins  = expandPart(minPart,  60).sort((a, b) => a - b);
  const dows  = expandPart(dowPart ?? '*', 7);

  for (let dayOffset = 0; dayOffset < 8; dayOffset++) {
    const dow = (local.dow + dayOffset) % 7;
    if (!dows.includes(dow)) continue;
    for (const h of hours) {
      for (const m of mins) {
        const totalMins = dayOffset * 24 * 60 + h * 60 + m - nowTotalMins;
        if (totalMins <= 1) continue;
        return addMs(now, totalMins * 60_000);
      }
    }
  }
  return minutesFromNow(1440);
}

// ============================================================
// RATE LIMITING
// ============================================================

async function checkRateLimit(platform: Platform, accountId: string, actionType: string): Promise<boolean> {
  const key = `prl:${platform}:${accountId}:${actionType}`;
  await redis.zremrangebyscore(key, 0, Date.now() - 86_400_000);
  const count = await redis.zcard(key);
  const limits = RATE_LIMITS[platform];
  const limit = (limits[`${actionType}s_per_day` as keyof typeof limits] as number) || 100;
  return count < limit;
}

async function recordAction(platform: string, accountId: string, actionType: string): Promise<void> {
  const key = `prl:${platform}:${accountId}:${actionType}`;
  const now = Date.now();
  await redis.zadd(key, now.toString(), `${now}:${Math.random()}`);
  await redis.expire(key, 86_400);
}

// ============================================================
// ACCOUNT + MEDIA PICKERS
// ============================================================

async function pickAccount(agent: Agent): Promise<PlatformAccount | null> {
  if (!agent.platform_account_ids?.length) return null;
  const idx = Math.floor(Math.random() * agent.platform_account_ids.length);
  return queryOne<PlatformAccount>('SELECT * FROM platform_accounts WHERE id = $1', [agent.platform_account_ids[idx]]);
}

async function pickMedia(agent: Agent): Promise<string | null> {
  // If a folder is assigned, pick a random file from it each time
  if ((agent as any).media_folder_id) {
    const files = await query<{ id: string }>(
      'SELECT id FROM media_files WHERE folder_id = $1 ORDER BY random() LIMIT 1',
      [(agent as any).media_folder_id],
    );
    return files[0]?.id ?? null;
  }

  if (!agent.remaining_media?.length && !agent.media_pool_ids?.length) return null;
  let remaining = [...(agent.remaining_media ?? [])];
  if (!remaining.length) remaining = [...(agent.media_pool_ids ?? [])];
  const mediaId = remaining.shift()!;
  await query('UPDATE agents SET remaining_media = $1 WHERE id = $2', [remaining, agent.id]);
  return mediaId;
}

// ============================================================
// ENQUEUE A SINGLE ACTION
// ============================================================

async function scheduleAction(
  agent: Agent,
  account: PlatformAccount,
  actionType: string,
  fireAt: Date,
  extra: Record<string, any> = {},
): Promise<void> {
  const allowed = await checkRateLimit(account.platform, account.id, actionType);
  if (!allowed) {
    console.log(`[Scheduler] Rate limit hit: ${account.platform}:${account.handle}:${actionType}`);
    return;
  }

  const delayMs = Math.max(0, fireAt.getTime() - Date.now());

  // Determine initial status based on agent's approval_mode
  // 'post' actions go to review queue when approval_mode is 'review'
  // Secondary actions (like, follow, retweet) always auto-queue regardless of mode
  const secondaryActions = new Set(['like', 'follow', 'retweet', 'subscribe', 'scrape']);
  const needsReview = agent.approval_mode === 'review' && !secondaryActions.has(actionType);
  const initialStatus = needsReview ? 'review' : 'queued';

  const [action] = await query<any>(
    `INSERT INTO agent_actions (
      agent_id, platform_account_id, action_type, status,
      target_post_id, target_user, target_subreddit, scheduled_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [
      agent.id, account.id, actionType, initialStatus,
      extra.target_post_id ?? null,
      extra.target_user ?? null,
      extra.target_subreddit ?? null,
      fireAt.toISOString(),
    ],
  );

  // Don't enqueue jobs that need human review — they'll be queued when approved
  if (needsReview) {
    console.log(`[Scheduler] Review-mode: action ${action.id} (${actionType}) awaiting approval`);
    return;
  }

  const opts = { delay: delayMs, attempts: 3, backoff: { type: 'exponential' as const, delay: 30_000 } };
  const jobData = { agent_id: agent.id, platform_account_id: account.id, action_id: action.id, platform: account.platform, ...extra };

  switch (actionType) {
    case 'post':          await postQueue.add(`post:${action.id}`, jobData, opts); break;
    case 'reply':
    case 'comment':       await replyQueue.add(`reply:${action.id}`, jobData, opts); break;
    case 'dm':            await dmQueue.add(`dm:${action.id}`, jobData, { ...opts, attempts: 2 }); break;
    case 'like':
    case 'follow':
    case 'retweet':
    case 'subscribe':     await engageQueue.add(`engage:${action.id}`, jobData, { delay: delayMs, attempts: 2 }); break;
    case 'scrape':        await scrapeQueue.add(`scrape:${action.id}`, jobData, { delay: 0, attempts: 2 }); break;
    case 'research_post': await researchQueue.add(`research:${action.id}`, jobData, opts); break;
  }

  await recordAction(account.platform, account.id, actionType);
  const fireStr = fireAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  console.log(`[Scheduler] Queued ${actionType} for "${agent.name}" → @${account.handle} | fires ${fireStr} (+${Math.round(delayMs/1000)}s)`);
}

// ============================================================
// MAIN TICK
// ============================================================

async function schedulerTick() {
  const now = new Date();

  // Only agents whose next_action_at is due (or never set)
  const agents = await query<Agent>(
    `SELECT * FROM agents WHERE enabled = true AND (next_action_at IS NULL OR next_action_at <= $1)`,
    [now.toISOString()],
  );

  if (agents.length > 0) {
    console.log(`[Scheduler] ${agents.length} agent(s) ready`);
  }

  for (const agent of agents) {
    try {
      // Guard: skip if there are already > 2 pending future jobs
      const [{ count }] = await query<{ count: string }>(
        `SELECT COUNT(*) as count FROM agent_actions
         WHERE agent_id = $1 AND status IN ('queued','processing') AND scheduled_at > $2`,
        [agent.id, now.toISOString()],
      );
      if (parseInt(count) > 2) {
        // Push next_action_at forward so we don't keep re-checking
        const bump = getNextFireTime(agent);
        await query('UPDATE agents SET next_action_at = $1 WHERE id = $2', [bump.toISOString(), agent.id]);
        console.log(`[Scheduler] "${agent.name}" already has ${count} pending jobs — skipping`);
        continue;
      }

      const account = await pickAccount(agent);
      if (!account) {
        console.warn(`[Scheduler] "${agent.name}" has no connected accounts`);
        continue;
      }

      const nextFire = getNextFireTime(agent);

      // Burst state tracking
      if (agent.schedule_type === 'burst') {
        const cfg = (agent.schedule_config ?? {}) as Record<string, any>;
        const burstCount = cfg.burst_count ?? 3;
        const current = cfg._burst_current ?? 0;
        const next = current >= burstCount - 1 ? 0 : current + 1;
        await query(
          `UPDATE agents SET schedule_config = schedule_config || $1::jsonb WHERE id = $2`,
          [JSON.stringify({ _burst_current: next }), agent.id],
        );
      }

      // ── Posts ──
      if (agent.auto_post) {
        await scheduleAction(agent, account, 'post', nextFire, { media_file_id: await pickMedia(agent) });
      }

      // ── Research posts (stagger 5 min after post) ──
      if (agent.auto_web_research) {
        await scheduleAction(agent, account, 'research_post', addMs(nextFire, 5 * 60_000));
      }

      // ── Replies ──
      if (agent.auto_reply || agent.auto_comment) {
        const replyFire = addMs(nextFire, 2 * 60_000);
        if (account.platform === 'reddit' && agent.subreddit_targets?.length) {
          const sub = agent.subreddit_targets[Math.floor(Math.random() * agent.subreddit_targets.length)];
          await scheduleAction(agent, account, 'reply', replyFire, { target_subreddit: sub });
        } else if (account.platform === 'twitter') {
          await scheduleAction(agent, account, 'reply', replyFire, {
            keywords: [...(agent.hashtag_targets ?? []), ...(agent.topic_keywords ?? [])].join(','),
          });
        }
      }

      // ── DMs ──
      if (agent.auto_dm) {
        const target = await queryOne<any>(
          `SELECT * FROM dm_targets WHERE agent_id=$1 AND platform=$2 AND messaged=false ORDER BY created_at LIMIT 1`,
          [agent.id, account.platform],
        );
        if (target) {
          await scheduleAction(agent, account, 'dm', addMs(nextFire, 7 * 60_000), { target_user: target.target_username });
        }
      }

      // ── Engagement ──
      if (agent.auto_like)    await scheduleAction(agent, account, 'like',    addMs(nextFire, 1 * 60_000));
      if (agent.auto_follow)  await scheduleAction(agent, account, 'follow',  addMs(nextFire, 4 * 60_000));
      if (agent.auto_retweet && account.platform === 'twitter') {
        await scheduleAction(agent, account, 'retweet', addMs(nextFire, 6 * 60_000));
      }

      // ── Scraping (Reddit) ──
      if (agent.subreddit_targets?.length && account.platform === 'reddit') {
        const sub = agent.subreddit_targets[Math.floor(Math.random() * agent.subreddit_targets.length)];
        await scheduleAction(agent, account, 'scrape', now, { target_subreddit: sub });
      }

      // Update next_action_at — blocks scheduler from re-queuing until this time
      await query(
        `UPDATE agents SET next_action_at = $1, last_active_at = now() WHERE id = $2`,
        [nextFire.toISOString(), agent.id],
      );

      const fireStr = nextFire.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      console.log(`[Scheduler] "${agent.name}" next fire → ${fireStr}`);

    } catch (err: any) {
      console.error(`[Scheduler] Error for "${agent.name}":`, err.message);
    }
  }
}

function addMs(d: Date, ms: number): Date { return new Date(d.getTime() + ms); }

// ============================================================
// START
// ============================================================

export function startScheduler() {
  const worker = new Worker(QUEUES.SCHEDULER, async () => { await schedulerTick(); }, { connection: redis });

  // Tick every 60 seconds — next_action_at guard prevents redundant work
  schedulerQueue.add('tick', {}, {
    repeat: { every: 60_000 },
    removeOnComplete: true,
    removeOnFail: 50,
  });

  console.log('[Scheduler] Started — 60s tick, guarded by next_action_at');
  return worker;
}
