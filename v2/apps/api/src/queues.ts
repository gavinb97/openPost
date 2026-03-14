// ============================================================
// BullMQ Queue references (API side — for dispatching approved actions)
// ============================================================

import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { config } from './config';
import { QUEUES } from '@onlyposts/shared';

export const redis = new Redis(config.redis.url, { maxRetriesPerRequest: null });
const conn = { connection: redis };

export const postQueue    = new Queue(QUEUES.POST,    conn);
export const replyQueue   = new Queue(QUEUES.REPLY,   conn);
export const dmQueue      = new Queue(QUEUES.DM,      conn);
export const engageQueue  = new Queue(QUEUES.ENGAGE,  conn);
export const researchQueue = new Queue(QUEUES.RESEARCH, conn);

export function queueForAction(actionType: string): Queue | null {
  switch (actionType) {
    case 'post':          return postQueue;
    case 'reply':
    case 'comment':       return replyQueue;
    case 'dm':            return dmQueue;
    case 'like':
    case 'follow':
    case 'retweet':
    case 'subscribe':     return engageQueue;
    case 'research_post': return researchQueue;
    default:              return null;
  }
}
