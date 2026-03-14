// ============================================================
// Auth Routes — Register, Login, Me
// ============================================================

import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { query, queryOne } from '../db';
import { requireAuth } from '../middleware/auth';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { RegisterSchema, LoginSchema } from '@onlyposts/shared';
import { z } from 'zod';

const UpdateProfileSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_-]+$/).optional(),
  email: z.string().email().max(255).optional(),
});

const ChangePasswordSchema = z.object({
  current_password: z.string().min(1),
  new_password: z.string().min(8).max(128),
});
import type { User, AuthPayload, LoginResponse } from '@onlyposts/shared';

export const authRouter = Router();

// ---------- Register ----------

authRouter.post('/register', asyncHandler(async (req, res) => {
  const data = RegisterSchema.parse(req.body);

  // Check existing
  const existing = await queryOne<User>(
    'SELECT id FROM users WHERE email = $1 OR username = $2',
    [data.email, data.username],
  );
  if (existing) throw new AppError(409, 'An account with that email or username already exists');

  // Hash password
  const hash = await bcrypt.hash(data.password, 12);

  // Insert user
  const user = await queryOne<User>(
    `INSERT INTO users (username, email, password) VALUES ($1, $2, $3)
     RETURNING id, username, email, pro, created_at, updated_at`,
    [data.username, data.email, hash],
  );

  // Generate token
  const payload: AuthPayload = {
    userId: user!.id,
    username: user!.username,
    email: user!.email,
    pro: user!.pro,
  };
  const token = jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn });

  const response: LoginResponse = { token, user: user! };
  res.status(201).json({ ok: true, data: response });
}));

// ---------- Login ----------

authRouter.post('/login', asyncHandler(async (req, res) => {
  const data = LoginSchema.parse(req.body);

  const user = await queryOne<User>(
    'SELECT * FROM users WHERE email = $1',
    [data.email],
  );
  if (!user) throw new AppError(401, 'Invalid email or password');

  const valid = await bcrypt.compare(data.password, user.password!);
  if (!valid) throw new AppError(401, 'Invalid email or password');

  const payload: AuthPayload = {
    userId: user.id,
    username: user.username,
    email: user.email,
    pro: user.pro,
  };
  const token = jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn });

  // Don't send password back
  const { password, ...safeUser } = user;
  res.json({ ok: true, data: { token, user: safeUser } });
}));

// ---------- Me ----------

authRouter.get('/me', requireAuth, asyncHandler(async (req, res) => {
  const user = await queryOne<User>(
    `SELECT id, username, email, pro, stripe_customer_id, stripe_subscription_id, created_at, updated_at
     FROM users WHERE id = $1`,
    [req.user!.userId],
  );
  if (!user) throw new AppError(404, 'User not found');

  res.json({ ok: true, data: user });
}));

// ---------- Update Profile ----------

authRouter.put('/me', requireAuth, asyncHandler(async (req, res) => {
  const { username, email } = UpdateProfileSchema.parse(req.body);

  const updates: string[] = [];
  const values: any[] = [];
  let idx = 1;

  if (username) {
    updates.push(`username = $${idx++}`);
    values.push(username);
  }
  if (email) {
    updates.push(`email = $${idx++}`);
    values.push(email);
  }

  if (updates.length === 0) throw new AppError(400, 'Nothing to update');

  values.push(req.user!.userId);
  const user = await queryOne<User>(
    `UPDATE users SET ${updates.join(', ')} WHERE id = $${idx}
     RETURNING id, username, email, pro, created_at, updated_at`,
    values,
  );

  res.json({ ok: true, data: user });
}));

// ---------- Change Password ----------

authRouter.put('/password', requireAuth, asyncHandler(async (req, res) => {
  const { current_password, new_password } = ChangePasswordSchema.parse(req.body);

  const user = await queryOne<User>('SELECT password FROM users WHERE id = $1', [req.user!.userId]);
  if (!user) throw new AppError(404, 'User not found');

  const valid = await bcrypt.compare(current_password, user.password!);
  if (!valid) throw new AppError(401, 'Current password is incorrect');

  const hash = await bcrypt.hash(new_password, 12);
  await query('UPDATE users SET password = $1 WHERE id = $2', [hash, req.user!.userId]);

  res.json({ ok: true, message: 'Password updated' });
}));
