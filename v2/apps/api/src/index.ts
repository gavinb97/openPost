// ============================================================
// OnlyPosts v2 — API Server Entry Point
// ============================================================

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config';
import { checkConnection } from './db';
import { errorHandler } from './middleware/errorHandler';
import { rateLimit } from './middleware/rateLimit';

// Route imports
import { authRouter } from './routes/auth';
import { oauthRouter } from './routes/oauth';
import { agentsRouter } from './routes/agents';
import { jobsRouter } from './routes/jobs';
import { mediaRouter } from './routes/media';
import { reviewRouter } from './routes/review';
import { metricsRouter } from './routes/metrics';
import { contentRouter } from './routes/content';
import { billingRouter } from './routes/billing';
import { campaignsRouter } from './routes/campaigns';

const app = express();

// ---------- Global Middleware ----------

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
    },
  },
  hsts: { maxAge: 31_536_000, includeSubDomains: true, preload: true },
  frameguard: { action: 'deny' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  crossOriginEmbedderPolicy: false, // allow S3 presigned URLs in browser
}));

// Environment-aware CORS: never allow localhost in production
const allowedOrigins = config.env === 'production'
  ? [
      'https://only-posts.com',
      'https://www.only-posts.com',
      'https://api.only-posts.com',
      config.frontendUrl,
    ].filter(Boolean)
  : [
      'http://localhost:3000',
      'http://localhost:3333',
      config.frontendUrl,
    ].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(morgan(config.env === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Global API rate limit: 200 requests per minute per IP/user
app.use('/api', rateLimit({ windowMs: 60_000, max: 200, keyPrefix: 'rl:api' }));

// Stricter rate limits for auth endpoints (applied before routes mount)
// 10 login attempts per 15 minutes per IP
app.use('/api/v2/auth/login', rateLimit({ windowMs: 15 * 60_000, max: 10, keyPrefix: 'rl:login' }));
// 5 registrations per hour per IP
app.use('/api/v2/auth/register', rateLimit({ windowMs: 60 * 60_000, max: 5, keyPrefix: 'rl:register' }));
// 5 password changes per hour
app.use('/api/v2/auth/password', rateLimit({ windowMs: 60 * 60_000, max: 5, keyPrefix: 'rl:password' }));

// ---------- Health Check ----------

app.get('/api/v2/health', async (_req, res) => {
  const dbOk = await checkConnection();
  res.json({
    ok: true,
    status: 'running',
    version: '2.0.0',
    database: dbOk ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

// ---------- Routes ----------

app.use('/api/v2/auth', authRouter);
app.use('/api/v2/oauth', oauthRouter);
app.use('/api/v2/agents', agentsRouter);
app.use('/api/v2/jobs', jobsRouter);
app.use('/api/v2/media', mediaRouter);
app.use('/api/v2/review', reviewRouter);
app.use('/api/v2/metrics', metricsRouter);
app.use('/api/v2/content', contentRouter);
app.use('/api/v2/billing', billingRouter);
app.use('/api/v2/campaigns', campaignsRouter);

// ---------- Error Handler ----------

app.use(errorHandler);

// ---------- Start Server ----------

app.listen(config.port, () => {
  console.log(`[API] OnlyPosts v2 running on port ${config.port}`);
  console.log(`[API] Environment: ${config.env}`);
});

export default app;
