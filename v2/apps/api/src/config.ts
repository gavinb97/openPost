// ============================================================
// Environment & App Configuration
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
  port: parseInt(optional('PORT', '5055'), 10),
  frontendUrl: optional('FRONTEND_URL', 'https://only-posts.com'),

  // Database
  postgres: {
    url: required('POSTGRES_URL'),
  },

  // Redis
  redis: {
    url: optional('REDIS_URL', 'redis://localhost:6379'),
  },

  // JWT
  jwt: {
    secret: required('JWT_SECRET'),
    expiresIn: '7d',
  },

  // OpenAI
  openai: {
    apiKey: required('OPENAI_API_KEY'),
  },

  // S3
  s3: {
    accessKey: required('S3_ACCESS_KEY'),
    secretKey: required('S3_ACCESS_SECRET'),
    bucket: optional('S3_BUCKET', 'onlyposts-media'),
    region: optional('S3_REGION', 'us-east-2'),
  },

  // Twitter
  twitter: {
    appKey: optional('TWITTER_APP_KEY', ''),
    appSecret: optional('TWITTER_APP_SECRET', ''),
    clientId: optional('TWITTER_CLIENT_ID', ''),
    clientSecret: optional('TWITTER_CLIENT_SECRET', ''),
    callbackUrl: optional('TWITTER_CALLBACK_URL', 'http://localhost:5055/api/v2/oauth/twitter/callback'),
  },

  // Reddit
  reddit: {
    appId: optional('REDDIT_APP_ID', ''),
    secret: optional('REDDIT_SECRET', ''),
    callbackUrl: optional('REDDIT_CALLBACK_URL', 'http://localhost:5055/api/v2/oauth/reddit/callback'),
    userAgent: optional('REDDIT_USER_AGENT', 'web:onlyposts:v2.0 (by /u/BugResponsible9056)'),
  },

  // YouTube
  youtube: {
    clientId: optional('YOUTUBE_CLIENT_ID', ''),
    clientSecret: optional('YOUTUBE_CLIENT_SECRET', ''),
    callbackUrl: optional('YOUTUBE_CALLBACK_URL', 'http://localhost:5055/api/v2/oauth/youtube/callback'),
  },

  // TikTok
  tiktok: {
    clientKey: optional('TIKTOK_CLIENT_KEY', ''),
    clientSecret: optional('TIKTOK_CLIENT_SECRET', ''),
    callbackUrl: optional('TIKTOK_CALLBACK_URL', 'http://localhost:5055/api/v2/oauth/tiktok/callback'),
  },

  // Stripe
  stripe: {
    key: optional('STRIPE_KEY', ''),
    secret: optional('STRIPE_SECRET', ''),
    webhookSecret: optional('STRIPE_WEBHOOK_SECRET', ''),
  },
} as const;
