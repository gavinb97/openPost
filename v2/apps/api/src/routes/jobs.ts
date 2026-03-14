// ============================================================
// Job Routes — CRUD + pause/resume
// ============================================================

import { Router } from 'express';
import { query, queryOne } from '../db';
import { requireAuth } from '../middleware/auth';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { CreateJobSchema } from '@onlyposts/shared';
import type { Job, JobExecution } from '@onlyposts/shared';

export const jobsRouter = Router();
jobsRouter.use(requireAuth);

// ---------- List jobs ----------

jobsRouter.get('/', asyncHandler(async (req, res) => {
  const status = req.query.status as string;
  const platform = req.query.platform as string;

  let sql = 'SELECT * FROM jobs WHERE user_id = $1';
  const params: any[] = [req.user!.userId];
  let idx = 2;

  if (status) {
    sql += ` AND status = $${idx++}`;
    params.push(status);
  }
  if (platform) {
    sql += ` AND platform = $${idx++}`;
    params.push(platform);
  }

  sql += ' ORDER BY created_at DESC';

  const jobs = await query<Job>(sql, params);
  res.json({ ok: true, data: { jobs } });
}));

// ---------- Get single job ----------

jobsRouter.get('/:id', asyncHandler(async (req, res) => {
  const job = await queryOne<Job>(
    'SELECT * FROM jobs WHERE id = $1 AND user_id = $2',
    [req.params.id, req.user!.userId],
  );
  if (!job) throw new AppError(404, 'Job not found');
  res.json({ ok: true, data: { job } });
}));

// ---------- Create job ----------

jobsRouter.post('/', asyncHandler(async (req, res) => {
  const data = CreateJobSchema.parse(req.body);

  // Verify platform account ownership
  if (data.platform_account_id) {
    const account = await queryOne(
      'SELECT id FROM platform_accounts WHERE id = $1 AND user_id = $2',
      [data.platform_account_id, req.user!.userId],
    );
    if (!account) throw new AppError(404, 'Platform account not found');
  }

  const job = await queryOne<Job>(
    `INSERT INTO jobs (
      user_id, agent_id, type, platform, platform_account_id,
      schedule_type, schedule_config, content_config, media_config, subreddit_config, duration
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *`,
    [
      req.user!.userId,
      data.agent_id || null,
      data.type,
      data.platform,
      data.platform_account_id,
      data.schedule_type || 'random',
      JSON.stringify(data.schedule_config || {}),
      JSON.stringify(data.content_config || {}),
      JSON.stringify(data.media_config || {}),
      JSON.stringify(data.subreddit_config || {}),
      data.duration || 0,
    ],
  );

  res.status(201).json({ ok: true, data: { job } });
}));

// ---------- Pause job ----------

jobsRouter.post('/:id/pause', asyncHandler(async (req, res) => {
  const job = await queryOne<Job>(
    `UPDATE jobs SET status = 'paused' WHERE id = $1 AND user_id = $2 AND status = 'active'
     RETURNING *`,
    [req.params.id, req.user!.userId],
  );
  if (!job) throw new AppError(404, 'Job not found or not active');
  res.json({ ok: true, data: { job } });
}));

// ---------- Resume job ----------

jobsRouter.post('/:id/resume', asyncHandler(async (req, res) => {
  const job = await queryOne<Job>(
    `UPDATE jobs SET status = 'active' WHERE id = $1 AND user_id = $2 AND status = 'paused'
     RETURNING *`,
    [req.params.id, req.user!.userId],
  );
  if (!job) throw new AppError(404, 'Job not found or not paused');
  res.json({ ok: true, data: { job } });
}));

// ---------- Cancel job ----------

jobsRouter.post('/:id/cancel', asyncHandler(async (req, res) => {
  const job = await queryOne<Job>(
    `UPDATE jobs SET status = 'cancelled' WHERE id = $1 AND user_id = $2 AND status IN ('active', 'paused')
     RETURNING *`,
    [req.params.id, req.user!.userId],
  );
  if (!job) throw new AppError(404, 'Job not found or already completed');
  res.json({ ok: true, data: { job } });
}));

// ---------- Delete job ----------

jobsRouter.delete('/:id', asyncHandler(async (req, res) => {
  const result = await queryOne(
    'DELETE FROM jobs WHERE id = $1 AND user_id = $2 RETURNING id',
    [req.params.id, req.user!.userId],
  );
  if (!result) throw new AppError(404, 'Job not found');
  res.json({ ok: true, message: 'Job deleted' });
}));

// ---------- Job executions ----------

jobsRouter.get('/:id/executions', asyncHandler(async (req, res) => {
  const job = await queryOne<Job>(
    'SELECT id FROM jobs WHERE id = $1 AND user_id = $2',
    [req.params.id, req.user!.userId],
  );
  if (!job) throw new AppError(404, 'Job not found');

  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
  const offset = (page - 1) * limit;

  const executions = await query<JobExecution>(
    `SELECT * FROM job_executions WHERE job_id = $1
     ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
    [req.params.id, limit, offset],
  );

  res.json({ ok: true, data: { executions, page, limit } });
}));
