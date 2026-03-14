// ============================================================
// Review Routes — Content approval queue
// ============================================================

import { Router } from 'express';
import { query, queryOne } from '../db';
import { requireAuth } from '../middleware/auth';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { ReviewActionSchema, BulkReviewSchema } from '@onlyposts/shared';
import { queueForAction } from '../queues';

export const reviewRouter = Router();
reviewRouter.use(requireAuth);

// ---------- Get review queue ----------

reviewRouter.get('/', asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
  const offset = (page - 1) * limit;

  const items = await query(
    `SELECT aa.*, a.name as agent_name, pa.handle as account_handle, pa.platform
     FROM agent_actions aa
     JOIN agents a ON a.id = aa.agent_id
     LEFT JOIN platform_accounts pa ON pa.id = aa.platform_account_id
     WHERE a.user_id = $1 AND aa.status = 'review'
     ORDER BY aa.created_at ASC
     LIMIT $2 OFFSET $3`,
    [req.user!.userId, limit, offset],
  );

  const [{ count }] = await query<{ count: string }>(
    `SELECT COUNT(*) as count FROM agent_actions aa
     JOIN agents a ON a.id = aa.agent_id
     WHERE a.user_id = $1 AND aa.status = 'review'`,
    [req.user!.userId],
  );

  res.json({
    ok: true,
    data: {
      actions: items,
      total: parseInt(count),
      page,
      limit,
    },
  });
}));

// ---------- Review single action ----------

reviewRouter.post('/:id', asyncHandler(async (req, res) => {
  const data = ReviewActionSchema.parse(req.body);

  // Verify ownership
  const action = await queryOne<any>(
    `SELECT aa.* FROM agent_actions aa
     JOIN agents a ON a.id = aa.agent_id
     WHERE aa.id = $1 AND a.user_id = $2 AND aa.status = 'review'`,
    [req.params.id, req.user!.userId],
  );
  if (!action) throw new AppError(404, 'Action not found or not in review');

  if (data.action === 'approve') {
    if (data.edited_content) {
      await query(
        `UPDATE agent_actions SET status = 'queued', reviewed_at = now(), reviewed_by = $1, content_text = $2 WHERE id = $3`,
        [req.user!.userId, data.edited_content, req.params.id],
      );
    } else {
      await query(
        `UPDATE agent_actions SET status = 'queued', reviewed_at = now(), reviewed_by = $1 WHERE id = $2`,
        [req.user!.userId, req.params.id],
      );
    }
    // Dispatch to BullMQ now that the action is approved
    const q = queueForAction(action.action_type);
    if (q) {
      const jobData = {
        agent_id: action.agent_id,
        platform_account_id: action.platform_account_id,
        action_id: action.id,
        platform: action.platform,
        ...(data.edited_content ? { override_content: data.edited_content } : {}),
      };
      await q.add(`approved:${action.id}`, jobData, { attempts: 3, backoff: { type: 'exponential', delay: 30_000 } });
    }
  } else {
    await query(
      `UPDATE agent_actions SET status = 'rejected', reviewed_at = now(), reviewed_by = $1
       WHERE id = $2`,
      [req.user!.userId, req.params.id],
    );
  }

  res.json({ ok: true, message: `Action ${data.action}d` });
}));

// ---------- Bulk review ----------

reviewRouter.post('/bulk', asyncHandler(async (req, res) => {
  const data = BulkReviewSchema.parse(req.body);
  const newStatus = data.action === 'approve' ? 'queued' : 'rejected';

  const result = await query<any>(
    `UPDATE agent_actions SET status = $1, reviewed_at = now(), reviewed_by = $2
     WHERE id = ANY($3::uuid[])
     AND agent_id IN (SELECT id FROM agents WHERE user_id = $4)
     AND status = 'review'
     RETURNING id, action_type, agent_id, platform_account_id`,
    [newStatus, req.user!.userId, data.action_ids, req.user!.userId],
  );

  // If approving, dispatch BullMQ jobs for each action
  if (data.action === 'approve') {
    await Promise.allSettled(
      result.map((row: any) => {
        const q = queueForAction(row.action_type);
        if (!q) return Promise.resolve();
        return q.add(`approved:${row.id}`, {
          agent_id: row.agent_id,
          platform_account_id: row.platform_account_id,
          action_id: row.id,
        }, { attempts: 3, backoff: { type: 'exponential', delay: 30_000 } });
      }),
    );
  }

  res.json({ ok: true, message: `${result.length} actions ${data.action}d` });
}));
