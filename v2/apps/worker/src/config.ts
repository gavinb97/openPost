// ============================================================
// Worker Configuration (mirrors API config)
// ============================================================

import dotenv from 'dotenv';
import { resolve } from 'path';

// Load .env from monorepo root (v2/)
dotenv.config({ path: resolve(__dirname, '../../..', '.env') });

function required(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
}

function optional(key: string, fallback: string): string {
  return process.env[key] || fallback;
}

export const config = {
  env: optional('NODE_ENV', 'development'),
  postgres: { url: required('POSTGRES_URL') },
  redis: { url: optional('REDIS_URL', 'redis://localhost:6379') },
  openai: { apiKey: required('OPENAI_API_KEY') },
  s3: {
    accessKey: required('S3_ACCESS_KEY'),
    secretKey: required('S3_ACCESS_SECRET'),
    bucket: optional('S3_BUCKET', 'poolpartys3'),
    region: optional('S3_REGION', 'us-east-2'),
  },
  twitter: {
    appKey: optional('TWITTER_APP_KEY', ''),
    appSecret: optional('TWITTER_APP_SECRET', ''),
  },
  reddit: {
    appId: optional('REDDIT_APP_ID', ''),
    secret: optional('REDDIT_SECRET', ''),
    userAgent: optional('REDDIT_USER_AGENT', 'web:onlyposts:v2.0 (by /u/BugResponsible9056)'),
  },
  youtube: {
    clientId: optional('YOUTUBE_CLIENT_ID', ''),
    clientSecret: optional('YOUTUBE_CLIENT_SECRET', ''),
  },
  tiktok: {
    clientKey: optional('TIKTOK_CLIENT_KEY', ''),
    clientSecret: optional('TIKTOK_CLIENT_SECRET', ''),
  },
} as const;
