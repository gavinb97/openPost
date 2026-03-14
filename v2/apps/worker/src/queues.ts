// ============================================================
// BullMQ Queue Definitions
// ============================================================

import { Queue, QueueEvents } from 'bullmq';
import Redis from 'ioredis';
import { config } from './config';
import { QUEUES } from '@onlyposts/shared';

// Shared Redis connection for all queues
export const redis = new Redis(config.redis.url, { maxRetriesPerRequest: null });

const defaultOpts = { connection: redis };

// Create queues
export const postQueue = new Queue(QUEUES.POST, defaultOpts);
export const replyQueue = new Queue(QUEUES.REPLY, defaultOpts);
export const dmQueue = new Queue(QUEUES.DM, defaultOpts);
export const engageQueue = new Queue(QUEUES.ENGAGE, defaultOpts);
export const scrapeQueue = new Queue(QUEUES.SCRAPE, defaultOpts);
export const researchQueue = new Queue(QUEUES.RESEARCH, defaultOpts);
export const schedulerQueue = new Queue(QUEUES.SCHEDULER, defaultOpts);
export const tokenRefreshQueue = new Queue(QUEUES.TOKEN_REFRESH, defaultOpts);

// Queue events for logging
export function attachQueueEvents(queue: Queue, name: string) {
  const events = new QueueEvents(name, defaultOpts);
  events.on('completed', ({ jobId }) => {
    console.log(`[${name}] Job ${jobId} completed`);
  });
  events.on('failed', ({ jobId, failedReason }) => {
    console.error(`[${name}] Job ${jobId} failed: ${failedReason}`);
  });
  return events;
}
