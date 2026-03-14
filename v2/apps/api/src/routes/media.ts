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
      width, height, duration_seconds, description, categories, nsfw, folder_id
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    RETURNING *`,
    [
      req.user!.userId, data.s3_key, config.s3.bucket,
      data.original_name, data.mime_type, data.size_bytes,
      data.width || null, data.height || null, data.duration_seconds || null,
      data.description || null, data.categories || [], data.nsfw || false,
      (data as any).folder_id || null,
    ],
  );

  res.status(201).json({ ok: true, data: { media } });
}));

// ---------- Folder CRUD ----------

mediaRouter.post('/folders', asyncHandler(async (req, res) => {
  const { name, label } = req.body;
  if (!name || typeof name !== 'string') throw new AppError(400, 'name is required');

  const folder = await queryOne(
    `INSERT INTO media_folders (user_id, name, label) VALUES ($1, $2, $3) RETURNING *`,
    [req.user!.userId, name.trim(), label?.trim() || null],
  );

  res.status(201).json({ ok: true, data: { folder } });
}));

mediaRouter.get('/folders', asyncHandler(async (req, res) => {
  const folders = await query(
    `SELECT f.*, COUNT(mf.id)::int as file_count
     FROM media_folders f
     LEFT JOIN media_files mf ON mf.folder_id = f.id
     WHERE f.user_id = $1
     GROUP BY f.id
     ORDER BY f.created_at ASC`,
    [req.user!.userId],
  );

  res.json({ ok: true, data: { folders } });
}));

mediaRouter.put('/folders/:id', asyncHandler(async (req, res) => {
  const { name, label } = req.body;

  const folder = await queryOne(
    'SELECT * FROM media_folders WHERE id = $1 AND user_id = $2',
    [req.params.id, req.user!.userId],
  );
  if (!folder) throw new AppError(404, 'Folder not found');

  const updated = await queryOne(
    `UPDATE media_folders
     SET name = $1, label = $2, updated_at = now()
     WHERE id = $3
     RETURNING *`,
    [
      name !== undefined ? name.trim() : (folder as any).name,
      label !== undefined ? (label?.trim() || null) : (folder as any).label,
      req.params.id,
    ],
  );

  res.json({ ok: true, data: { folder: updated } });
}));

mediaRouter.delete('/folders/:id', asyncHandler(async (req, res) => {
  const folder = await queryOne(
    'SELECT * FROM media_folders WHERE id = $1 AND user_id = $2',
    [req.params.id, req.user!.userId],
  );
  if (!folder) throw new AppError(404, 'Folder not found');

  // Files get folder_id = NULL automatically via ON DELETE SET NULL
  await query('DELETE FROM media_folders WHERE id = $1', [req.params.id]);

  res.json({ ok: true, message: 'Folder deleted' });
}));

// ---------- List media library ----------

mediaRouter.get('/', asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
  const offset = (page - 1) * limit;
  const category = req.query.category as string;
  const folderIdParam = req.query.folder_id as string;

  let sql = 'SELECT * FROM media_files WHERE user_id = $1';
  const params: any[] = [req.user!.userId];
  let idx = 2;

  if (category) {
    sql += ` AND $${idx++} = ANY(categories)`;
    params.push(category);
  }

  if (folderIdParam === 'none') {
    sql += ' AND folder_id IS NULL';
  } else if (folderIdParam) {
    sql += ` AND folder_id = $${idx++}`;
    params.push(folderIdParam);
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

  // Count respects same filters
  let countSql = 'SELECT COUNT(*) as count FROM media_files WHERE user_id = $1';
  const countParams: any[] = [req.user!.userId];
  let cidx = 2;
  if (category) { countSql += ` AND $${cidx++} = ANY(categories)`; countParams.push(category); }
  if (folderIdParam === 'none') { countSql += ' AND folder_id IS NULL'; }
  else if (folderIdParam) { countSql += ` AND folder_id = $${cidx++}`; countParams.push(folderIdParam); }
  const [{ count }] = await query<{ count: string }>(countSql, countParams);

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

// ---------- Folder CRUD ----------

mediaRouter.post('/folders', asyncHandler(async (req, res) => {
  const { name, label } = req.body;
  if (!name?.trim()) throw new AppError(400, 'Folder name is required');
  const folder = await queryOne(
    `INSERT INTO media_folders (user_id, name, label) VALUES ($1, $2, $3) RETURNING *, 0 as file_count`,
    [req.user!.userId, name.trim(), label?.trim() || null],
  );
  res.status(201).json({ ok: true, data: { folder } });
}));

mediaRouter.get('/folders', asyncHandler(async (req, res) => {
  const folders = await query(
    `SELECT f.*, COUNT(mf.id)::int as file_count
     FROM media_folders f
     LEFT JOIN media_files mf ON mf.folder_id = f.id
     WHERE f.user_id = $1
     GROUP BY f.id
     ORDER BY f.created_at ASC`,
    [req.user!.userId],
  );
  res.json({ ok: true, data: { folders } });
}));

mediaRouter.put('/folders/:id', asyncHandler(async (req, res) => {
  const folder = await queryOne(
    'SELECT * FROM media_folders WHERE id = $1 AND user_id = $2',
    [req.params.id, req.user!.userId],
  );
  if (!folder) throw new AppError(404, 'Folder not found');
  const { name, label } = req.body;
  const updated = await queryOne(
    `UPDATE media_folders SET name = COALESCE($1, name), label = $2, updated_at = now()
     WHERE id = $3 RETURNING *`,
    [name?.trim() || null, label !== undefined ? (label?.trim() || null) : (folder as any).label, req.params.id],
  );
  res.json({ ok: true, data: { folder: updated } });
}));

mediaRouter.delete('/folders/:id', asyncHandler(async (req, res) => {
  const folder = await queryOne(
    'SELECT * FROM media_folders WHERE id = $1 AND user_id = $2',
    [req.params.id, req.user!.userId],
  );
  if (!folder) throw new AppError(404, 'Folder not found');
  // Nullify folder_id on all files (ON DELETE SET NULL handles it, but explicit for clarity)
  await query('UPDATE media_files SET folder_id = NULL WHERE folder_id = $1', [req.params.id]);
  await query('DELETE FROM media_folders WHERE id = $1', [req.params.id]);
  res.json({ ok: true, message: 'Folder deleted' });
}));

// ---------- Update media (rename / move to folder) ----------

mediaRouter.put('/:id', asyncHandler(async (req, res) => {
  const media = await queryOne<MediaFile>(
    'SELECT * FROM media_files WHERE id = $1 AND user_id = $2',
    [req.params.id, req.user!.userId],
  );
  if (!media) throw new AppError(404, 'Media not found');

  const { original_name, folder_id } = req.body;

  // folder_id can be null (move to "All Files"), a UUID, or absent (no change)
  const newName = original_name !== undefined ? original_name.trim() : media.original_name;
  const newFolder = Object.prototype.hasOwnProperty.call(req.body, 'folder_id')
    ? (folder_id || null)
    : (media as any).folder_id;

  const updated = await queryOne(
    `UPDATE media_files
     SET original_name = $1, folder_id = $2, updated_at = now()
     WHERE id = $3
     RETURNING *`,
    [newName, newFolder, req.params.id],
  );

  res.json({ ok: true, data: { media: updated } });
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
