// ============================================================
// Media Routes — S3 presigned upload/download + library
// ============================================================

import { Router } from 'express';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuid } from 'uuid';
import { config } from '../config';
import { query, queryOne } from '../db';
import { requireAuth } from '../middleware/auth';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { PresignUploadSchema, RegisterMediaSchema } from '@onlyposts/shared';
import type { MediaFile } from '@onlyposts/shared';

export const mediaRouter = Router();
mediaRouter.use(requireAuth);

const s3 = new S3Client({
  region: config.s3.region,
  credentials: {
    accessKeyId: config.s3.accessKey,
    secretAccessKey: config.s3.secretKey,
  },
});

// ---------- Get presigned upload URL ----------

mediaRouter.post('/upload-url', asyncHandler(async (req, res) => {
  const data = PresignUploadSchema.parse(req.body);

  const ext = data.filename.split('.').pop() || 'bin';
  const key = `users/${req.user!.userId}/${uuid()}.${ext}`;

  const command = new PutObjectCommand({
    Bucket: config.s3.bucket,
    Key: key,
    ContentType: data.mime_type,
    ContentLength: data.size_bytes,
  });

  const url = await getSignedUrl(s3, command, { expiresIn: 3600 });

  res.json({ ok: true, data: { upload_url: url, key, s3_key: key } });
}));

// ---------- Register uploaded media ----------

mediaRouter.post('/register', asyncHandler(async (req, res) => {
  const data = RegisterMediaSchema.parse(req.body);

  const media = await queryOne<MediaFile>(
    `INSERT INTO media_files (
      user_id, s3_key, s3_bucket, original_name, mime_type, size_bytes,
      width, height, duration_seconds, description, categories, nsfw
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING *`,
    [
      req.user!.userId, data.s3_key, config.s3.bucket,
      data.original_name, data.mime_type, data.size_bytes,
      data.width || null, data.height || null, data.duration_seconds || null,
      data.description || null, data.categories || [], data.nsfw || false,
    ],
  );

  res.status(201).json({ ok: true, data: { media } });
}));

// ---------- List media library ----------

mediaRouter.get('/', asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
  const offset = (page - 1) * limit;
  const category = req.query.category as string;

  let sql = 'SELECT * FROM media_files WHERE user_id = $1';
  const params: any[] = [req.user!.userId];
  let idx = 2;

  if (category) {
    sql += ` AND $${idx++} = ANY(categories)`;
    params.push(category);
  }

  sql += ' ORDER BY created_at DESC LIMIT $' + idx++ + ' OFFSET $' + idx++;
  params.push(limit, offset);

  const media = await query<MediaFile>(sql, params);

  // Add presigned URLs for viewing
  const mediaWithUrls = await Promise.all(
    media.map(async (m) => {
      const command = new GetObjectCommand({ Bucket: m.s3_bucket, Key: m.s3_key });
      const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
      return { ...m, url };
    }),
  );

  const [{ count }] = await query<{ count: string }>(
    'SELECT COUNT(*) as count FROM media_files WHERE user_id = $1',
    [req.user!.userId],
  );

  res.json({
    ok: true,
    data: {
      media: mediaWithUrls,
      total: parseInt(count),
      page,
      limit,
    },
  });
}));

// ---------- Get single media ----------

mediaRouter.get('/:id', asyncHandler(async (req, res) => {
  const media = await queryOne<MediaFile>(
    'SELECT * FROM media_files WHERE id = $1 AND user_id = $2',
    [req.params.id, req.user!.userId],
  );
  if (!media) throw new AppError(404, 'Media not found');

  const command = new GetObjectCommand({ Bucket: media.s3_bucket, Key: media.s3_key });
  const url = await getSignedUrl(s3, command, { expiresIn: 3600 });

  res.json({ ok: true, data: { ...media, url } });
}));

// ---------- Delete media ----------

mediaRouter.delete('/:id', asyncHandler(async (req, res) => {
  const media = await queryOne<MediaFile>(
    'SELECT * FROM media_files WHERE id = $1 AND user_id = $2',
    [req.params.id, req.user!.userId],
  );
  if (!media) throw new AppError(404, 'Media not found');

  // Delete from S3
  try {
    await s3.send(new DeleteObjectCommand({ Bucket: media.s3_bucket, Key: media.s3_key }));
  } catch (err) {
    console.error('[Media] S3 delete error:', err);
  }

  // Delete from DB
  await query('DELETE FROM media_files WHERE id = $1', [media.id]);

  res.json({ ok: true, message: 'Media deleted' });
}));
