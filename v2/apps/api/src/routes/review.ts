// ============================================================
// Review Routes — Content approval queue
// ============================================================

import { Router } from 'express';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { query, queryOne } from '../db';
import { requireAuth } from '../middleware/auth';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { ReviewActionSchema, BulkReviewSchema } from '@onlyposts/shared';
import { queueForAction } from '../queues';
import { config } from '../config';

const s3 = new S3Client({
  region: config.s3.region,
  credentials: { accessKeyId: config.s3.accessKey, secretAccessKey: config.s3.secretKey },
  requestChecksumCalculation: 'WHEN_REQUIRED',
});

export const reviewRouter = Router();
reviewRouter.use(requireAuth);

// ---------- Get review queue ----------

reviewRouter.get('/', asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
  const offset = (page - 1) * limit;

  const items = await query<any>(
    `SELECT aa.*, a.name as agent_name, pa.handle as account_handle, pa.platform,
            mf.s3_key as media_s3_key, mf.s3_bucket as media_s3_bucket, mf.mime_type as media_mime_type
     FROM agent_actions aa
     JOIN agents a ON a.id = aa.agent_id
     LEFT JOIN platform_accounts pa ON pa.id = aa.platform_account_id
     LEFT JOIN media_files mf ON mf.id = aa.media_file_id
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

  // Generate presigned URLs for actions with media
  const actionsWithMedia = await Promise.all(
    items.map(async (item) => {
      if (!item.media_s3_key) return item;
      const cmd = new GetObjectCommand({ Bucket: item.media_s3_bucket, Key: item.media_s3_key });
      const media_url = await getSignedUrl(s3, cmd, { expiresIn: 3600 });
      return { ...item, media_url };
    }),
  );

  res.json({
    ok: true,
    data: {
      actions: actionsWithMedia,
      total: parseInt(count),
      page,
      limit,
    },
  });
}));

// ---------- Review single action ----------

reviewRouter.post('/:id', asyncHandler(async (req, res) => {
  const data = ReviewActionSchema.parse(req.body);

  // Verify ownership — JOIN platform_accounts to get platform for job dispatch
  const action = await queryOne<any>(
    `SELECT aa.*, pa.platform FROM agent_actions aa
     JOIN agents a ON a.id = aa.agent_id
     LEFT JOIN platform_accounts pa ON pa.id = aa.platform_account_id
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
        action_type: action.action_type,
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

  // If approving, dispatch BullMQ jobs — fetch platform per account
  if (data.action === 'approve' && result.length > 0) {
    const accountIds = [...new Set(result.map((r: any) => r.platform_account_id).filter(Boolean))];
    const accounts = accountIds.length
      ? await query<any>(`SELECT id, platform FROM platform_accounts WHERE id = ANY($1::uuid[])`, [accountIds])
      : [];
    const platformMap: Record<string, string> = {};
    for (const a of accounts) platformMap[a.id] = a.platform;

    await Promise.allSettled(
      result.map((row: any) => {
        const q = queueForAction(row.action_type);
        if (!q) return Promise.resolve();
        return q.add(`approved:${row.id}`, {
          agent_id: row.agent_id,
          platform_account_id: row.platform_account_id,
          action_id: row.id,
          platform: platformMap[row.platform_account_id],
          action_type: row.action_type,
        }, { attempts: 3, backoff: { type: 'exponential', delay: 30_000 } });
      }),
    );
  }

  res.json({ ok: true, message: `${result.length} actions ${data.action}d` });
}));
