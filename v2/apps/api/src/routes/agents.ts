// ============================================================
// Agent Routes — CRUD + enable/disable
// ============================================================

import { Router } from 'express';
import { query, queryOne } from '../db';
import { requireAuth } from '../middleware/auth';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { CreateAgentSchema, UpdateAgentSchema } from '@onlyposts/shared';
import type { Agent } from '@onlyposts/shared';

export const agentsRouter = Router();
agentsRouter.use(requireAuth);

// ---------- List agents ----------

agentsRouter.get('/', asyncHandler(async (req, res) => {
  const agents = await query<Agent>(
    'SELECT * FROM agents WHERE user_id = $1 ORDER BY created_at DESC',
    [req.user!.userId],
  );
  res.json({ ok: true, data: { agents } });
}));

// ---------- Get single agent ----------

agentsRouter.get('/:id', asyncHandler(async (req, res) => {
  const agent = await queryOne<Agent>(
    'SELECT * FROM agents WHERE id = $1 AND user_id = $2',
    [req.params.id, req.user!.userId],
  );
  if (!agent) throw new AppError(404, 'Agent not found');
  res.json({ ok: true, data: { agent } });
}));

// ---------- Create agent ----------

agentsRouter.post('/', asyncHandler(async (req, res) => {
  const data = CreateAgentSchema.parse(req.body);

  const agent = await queryOne<Agent>(
    `INSERT INTO agents (
      user_id, name, description, personality_prompt, model,
      schedule_type, schedule_config, approval_mode,
      auto_post, auto_reply, auto_dm, auto_like, auto_follow, auto_retweet, auto_comment,
      auto_web_research, web_research_config,
      platform_account_ids, subreddit_targets, hashtag_targets, topic_keywords,
      dm_template, dm_max_per_day, media_pool_ids, remaining_media, media_folder_id
    ) VALUES (
      $1, $2, $3, $4, $5,
      $6, $7, $8,
      $9, $10, $11, $12, $13, $14, $15,
      $16, $17,
      $18, $19, $20, $21,
      $22, $23, $24, $24, $25
    ) RETURNING *`,
    [
      req.user!.userId,
      data.name,
      data.description || null,
      data.personality_prompt || 'You are a witty, engaging social media personality.',
      data.model || 'gpt-4o',
      data.schedule_type || 'random',
      JSON.stringify(data.schedule_config || { min_minutes: 30, max_minutes: 480 }),
      data.approval_mode || 'auto_with_guardrails',
      data.auto_post ?? true,
      data.auto_reply ?? false,
      data.auto_dm ?? false,
      data.auto_like ?? false,
      data.auto_follow ?? false,
      data.auto_retweet ?? false,
      data.auto_comment ?? false,
      data.auto_web_research ?? false,
      JSON.stringify(data.web_research_config || {}),
      data.platform_account_ids || [],
      data.subreddit_targets || [],
      data.hashtag_targets || [],
      data.topic_keywords || [],
      data.dm_template || null,
      data.dm_max_per_day || 50,
      data.media_pool_ids || [],
      (data as any).media_folder_id || null,
    ],
  );

  res.status(201).json({ ok: true, data: { agent } });
}));

// ---------- Update agent ----------

agentsRouter.put('/:id', asyncHandler(async (req, res) => {
  const data = UpdateAgentSchema.parse(req.body);

  // Build dynamic update
  const setClauses: string[] = [];
  const values: any[] = [];
  let idx = 1;

  const fields: Record<string, any> = {
    name: data.name,
    description: data.description,
    personality_prompt: data.personality_prompt,
    model: data.model,
    schedule_type: data.schedule_type,
    approval_mode: data.approval_mode,
    auto_post: data.auto_post,
    auto_reply: data.auto_reply,
    auto_dm: data.auto_dm,
    auto_like: data.auto_like,
    auto_follow: data.auto_follow,
    auto_retweet: data.auto_retweet,
    auto_comment: data.auto_comment,
    auto_web_research: data.auto_web_research,
    dm_template: data.dm_template,
    dm_max_per_day: data.dm_max_per_day,
  };

  for (const [key, val] of Object.entries(fields)) {
    if (val !== undefined) {
      setClauses.push(`${key} = $${idx++}`);
      values.push(val);
    }
  }

  // JSON/array fields need special handling
  if (data.schedule_config !== undefined) {
    setClauses.push(`schedule_config = $${idx++}`);
    values.push(JSON.stringify(data.schedule_config));
  }
  if (data.web_research_config !== undefined) {
    setClauses.push(`web_research_config = $${idx++}`);
    values.push(JSON.stringify(data.web_research_config));
  }
  if (data.platform_account_ids !== undefined) {
    setClauses.push(`platform_account_ids = $${idx++}`);
    values.push(data.platform_account_ids);
  }
  if (data.subreddit_targets !== undefined) {
    setClauses.push(`subreddit_targets = $${idx++}`);
    values.push(data.subreddit_targets);
  }
  if (data.hashtag_targets !== undefined) {
    setClauses.push(`hashtag_targets = $${idx++}`);
    values.push(data.hashtag_targets);
  }
  if (data.topic_keywords !== undefined) {
    setClauses.push(`topic_keywords = $${idx++}`);
    values.push(data.topic_keywords);
  }
  if (data.media_pool_ids !== undefined) {
    setClauses.push(`media_pool_ids = $${idx++}`);
    values.push(data.media_pool_ids);
    setClauses.push(`remaining_media = $${idx++}`);
    values.push(data.media_pool_ids); // reset remaining
  }
  if ((data as any).media_folder_id !== undefined) {
    setClauses.push(`media_folder_id = $${idx++}`);
    values.push((data as any).media_folder_id || null);
  }

  if (setClauses.length === 0) throw new AppError(400, 'Nothing to update');

  values.push(req.params.id);
  values.push(req.user!.userId);

  const agent = await queryOne<Agent>(
    `UPDATE agents SET ${setClauses.join(', ')}
     WHERE id = $${idx++} AND user_id = $${idx}
     RETURNING *`,
    values,
  );

  if (!agent) throw new AppError(404, 'Agent not found');
  res.json({ ok: true, data: { agent } });
}));

// ---------- Toggle enable/disable ----------

agentsRouter.post('/:id/toggle', asyncHandler(async (req, res) => {
  const agent = await queryOne<Agent>(
    `UPDATE agents SET enabled = NOT enabled
     WHERE id = $1 AND user_id = $2
     RETURNING *`,
    [req.params.id, req.user!.userId],
  );
  if (!agent) throw new AppError(404, 'Agent not found');
  res.json({ ok: true, data: { agent } });
}));

// ---------- Delete agent ----------

agentsRouter.delete('/:id', asyncHandler(async (req, res) => {
  const result = await queryOne(
    'DELETE FROM agents WHERE id = $1 AND user_id = $2 RETURNING id',
    [req.params.id, req.user!.userId],
  );
  if (!result) throw new AppError(404, 'Agent not found');
  res.json({ ok: true, message: 'Agent deleted' });
}));

// ---------- Get agent actions (activity feed) ----------

agentsRouter.get('/:id/actions', asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
  const offset = (page - 1) * limit;

  // Verify ownership
  const agent = await queryOne<Agent>(
    'SELECT id FROM agents WHERE id = $1 AND user_id = $2',
    [req.params.id, req.user!.userId],
  );
  if (!agent) throw new AppError(404, 'Agent not found');

  const actions = await query(
    `SELECT * FROM agent_actions WHERE agent_id = $1
     ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
    [req.params.id, limit, offset],
  );

  const [{ count }] = await query<{ count: string }>(
    'SELECT COUNT(*) as count FROM agent_actions WHERE agent_id = $1',
    [req.params.id],
  );

  res.json({
    ok: true,
    data: {
      actions,
      total: parseInt(count),
      page,
      limit,
    },
  });
}));

// ---------- Get agent conversations ----------

agentsRouter.get('/:id/conversations', asyncHandler(async (req, res) => {
  const agent = await queryOne<Agent>(
    'SELECT id FROM agents WHERE id = $1 AND user_id = $2',
    [req.params.id, req.user!.userId],
  );
  if (!agent) throw new AppError(404, 'Agent not found');

  const conversations = await query(
    `SELECT * FROM agent_conversations WHERE agent_id = $1
     ORDER BY last_interaction_at DESC NULLS LAST LIMIT 50`,
    [req.params.id],
  );

  res.json({ ok: true, data: { conversations } });
}));
