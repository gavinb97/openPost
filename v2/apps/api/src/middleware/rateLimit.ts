// ============================================================
// Redis-backed Sliding Window Rate Limiter
// ============================================================

import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';
import { config } from '../config';

const redis = new Redis(config.redis.url);

interface RateLimitOpts {
  windowMs: number;   // time window in ms
  max: number;        // max requests per window
  keyPrefix?: string;
}

/**
 * Express middleware rate limiter (API-level safety net).
 * Uses Redis sliding window counters.
 */
export function rateLimit(opts: RateLimitOpts) {
  const { windowMs, max, keyPrefix = 'rl' } = opts;

  return async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.userId || req.ip;
    const key = `${keyPrefix}:${userId}`;
    const now = Date.now();
    const windowStart = now - windowMs;

    try {
      const multi = redis.multi();
      // Remove old entries outside the window
      multi.zremrangebyscore(key, 0, windowStart);
      // Add current request
      multi.zadd(key, now.toString(), `${now}:${Math.random()}`);
      // Count requests in window
      multi.zcard(key);
      // Set expiry on the key
      multi.expire(key, Math.ceil(windowMs / 1000));

      const results = await multi.exec();
      const count = results?.[2]?.[1] as number;

      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, max - count));
      res.setHeader('X-RateLimit-Reset', Math.ceil((now + windowMs) / 1000));

      if (count > max) {
        res.status(429).json({
          ok: false,
          error: 'Too many requests. Please slow down.',
          retryAfter: Math.ceil(windowMs / 1000),
        });
        return;
      }

      next();
    } catch (err) {
      console.error('[RateLimit] Redis error:', err);
      // Fail closed for sensitive auth routes — fail open for everything else
      const isSensitive = req.path.includes('/login') || req.path.includes('/register') || req.path.includes('/password');
      if (isSensitive) {
        res.status(503).json({ ok: false, error: 'Service temporarily unavailable. Please try again shortly.' });
        return;
      }
      next();
    }
  };
}

/**
 * Platform-level rate limiter (used by workers).
 * Checks if a platform action is within rate limits.
 */
export async function checkPlatformRateLimit(
  platform: string,
  accountId: string,
  actionType: string,
  limit: number,
  windowMs: number = 86_400_000, // 24h default
): Promise<{ allowed: boolean; remaining: number }> {
  const key = `prl:${platform}:${accountId}:${actionType}`;
  const now = Date.now();
  const windowStart = now - windowMs;

  const multi = redis.multi();
  multi.zremrangebyscore(key, 0, windowStart);
  multi.zcard(key);

  const results = await multi.exec();
  const count = (results?.[1]?.[1] as number) || 0;

  return {
    allowed: count < limit,
    remaining: Math.max(0, limit - count),
  };
}

/**
 * Record a platform action for rate limiting.
 */
export async function recordPlatformAction(
  platform: string,
  accountId: string,
  actionType: string,
): Promise<void> {
  const key = `prl:${platform}:${accountId}:${actionType}`;
  const now = Date.now();
  await redis.zadd(key, now.toString(), `${now}:${Math.random()}`);
  await redis.expire(key, 86_400); // 24h TTL
}

export { redis };
