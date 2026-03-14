// ============================================================
// Metrics Routes — Dashboard analytics
// ============================================================

import { Router } from 'express';
import { query, queryOne } from '../db';
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

export const metricsRouter = Router();
metricsRouter.use(requireAuth);

// ---------- Dashboard overview ----------

metricsRouter.get('/overview', asyncHandler(async (req, res) => {
  const userId = req.user!.userId;

  // Run multiple queries in parallel
  const [agents, accounts, actions24h, actionsAll, review, jobStats] = await Promise.all([
    // Total agents / active agents
    query<{ total: string; active: string }>(
      `SELECT COUNT(*)::text as total,
              COUNT(*) FILTER (WHERE enabled)::text as active
       FROM agents WHERE user_id = $1`,
      [userId],
    ),

    // Connected accounts by platform
    query<{ platform: string; count: string }>(
      `SELECT platform, COUNT(*)::text as count
       FROM platform_accounts WHERE user_id = $1
       GROUP BY platform`,
      [userId],
    ),

    // Actions in last 24 hours
    query<{ action_type: string; status: string; count: string }>(
      `SELECT aa.action_type, aa.status, COUNT(*)::text as count
       FROM agent_actions aa
       JOIN agents a ON a.id = aa.agent_id
       WHERE a.user_id = $1 AND aa.created_at > now() - interval '24 hours'
       GROUP BY aa.action_type, aa.status`,
      [userId],
    ),

    // All-time action totals
    query<{ action_type: string; count: string }>(
      `SELECT aa.action_type, COUNT(*)::text as count
       FROM agent_actions aa
       JOIN agents a ON a.id = aa.agent_id
       WHERE a.user_id = $1
       GROUP BY aa.action_type`,
      [userId],
    ),

    // Pending reviews count
    queryOne<{ count: string }>(
      `SELECT COUNT(*)::text as count
       FROM agent_actions aa
       JOIN agents a ON a.id = aa.agent_id
       WHERE a.user_id = $1 AND aa.status = 'review'`,
      [userId],
    ),

    // Job stats
    query<{ status: string; count: string }>(
      `SELECT status, COUNT(*)::text as count
       FROM jobs WHERE user_id = $1
       GROUP BY status`,
      [userId],
    ),
  ]);

  res.json({
    ok: true,
    data: {
      agents: {
        total: parseInt(agents[0]?.total || '0'),
        active: parseInt(agents[0]?.active || '0'),
      },
      accounts: accounts.reduce((acc, a) => ({ ...acc, [a.platform]: parseInt(a.count) }), {}),
      actions_24h: actions24h.map((a) => ({
        action_type: a.action_type,
        status: a.status,
        count: parseInt(a.count),
      })),
      actions_all: actionsAll.map((a) => ({
        action_type: a.action_type,
        count: parseInt(a.count),
      })),
      pending_reviews: parseInt(review?.count || '0'),
      jobs: jobStats.reduce((acc, j) => ({ ...acc, [j.status]: parseInt(j.count) }), {}),
    },
  });
}));

// ---------- Activity timeline (for charts) ----------

metricsRouter.get('/timeline', asyncHandler(async (req, res) => {
  const userId = req.user!.userId;
  const days = Math.min(parseInt(req.query.days as string) || 7, 90);

  const timeline = await query(
    `SELECT
       date_trunc('day', aa.created_at)::date as date,
       aa.action_type,
       COUNT(*) FILTER (WHERE aa.status = 'published')::int as published,
       COUNT(*) FILTER (WHERE aa.status = 'failed')::int as failed,
       COUNT(*)::int as total
     FROM agent_actions aa
     JOIN agents a ON a.id = aa.agent_id
     WHERE a.user_id = $1 AND aa.created_at > now() - ($2 || ' days')::interval
     GROUP BY date, aa.action_type
     ORDER BY date`,
    [userId, days.toString()],
  );

  res.json({ ok: true, data: { timeline } });
}));

// ---------- Agent leaderboard ----------

metricsRouter.get('/agents', asyncHandler(async (req, res) => {
  const userId = req.user!.userId;

  const agentStats = await query(
    `SELECT
       a.id, a.name, a.enabled,
       a.posts_made, a.replies_sent, a.dms_sent, a.likes_given, a.follows_made,
       a.last_active_at,
       COUNT(aa.id) FILTER (WHERE aa.status = 'published')::int as successful_actions,
       COUNT(aa.id) FILTER (WHERE aa.status = 'failed')::int as failed_actions,
       COUNT(aa.id) FILTER (WHERE aa.status = 'review')::int as pending_reviews
     FROM agents a
     LEFT JOIN agent_actions aa ON aa.agent_id = a.id
     WHERE a.user_id = $1
     GROUP BY a.id
     ORDER BY a.posts_made + a.replies_sent + a.dms_sent DESC`,
    [userId],
  );

  res.json({ ok: true, data: { leaderboard: agentStats } });
}));
