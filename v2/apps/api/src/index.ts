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

app.use(helmet());
app.use(cors({
  origin: [
    config.frontendUrl,
    'https://only-posts.com',
    'https://www.only-posts.com',
    'https://api.only-posts.com',
    'http://localhost:3000',
    'http://localhost:3333',
  ],
  credentials: true,
}));
app.use(morgan(config.env === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Global API rate limit: 200 requests per minute per user
app.use('/api', rateLimit({ windowMs: 60_000, max: 200, keyPrefix: 'rl:api' }));

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
