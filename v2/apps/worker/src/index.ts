// ============================================================
// Worker Entry Point — Starts scheduler & all processors
// ============================================================

import { config } from './config';
import { startScheduler } from './scheduler';
import { startPostProcessor } from './processors/post';
import { startReplyProcessor } from './processors/reply';
import { startDMProcessor } from './processors/dm';
import { startEngageProcessor } from './processors/engage';
import { startScrapeProcessor } from './processors/scrape';
import { startResearchProcessor } from './processors/research';
import { attachQueueEvents } from './queues';
import { QUEUES } from '@onlyposts/shared';

async function main() {
  console.log('='.repeat(50));
  console.log('  OnlyPosts Worker v2');
  console.log('='.repeat(50));

  // Attach queue event logging
  for (const queueName of Object.values(QUEUES)) {
    attachQueueEvents(queueName);
  }
  console.log('[Worker] Queue event listeners attached');

  // Start all processors
  const postWorker = startPostProcessor();
  const replyWorker = startReplyProcessor();
  const dmWorker = startDMProcessor();
  const engageWorker = startEngageProcessor();
  const scrapeWorker = startScrapeProcessor();
  const researchWorker = startResearchProcessor();
  console.log('[Worker] All processors started');

  // Start the scheduler
  const schedulerWorker = startScheduler();
  console.log('[Worker] Scheduler started');

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`\n[Worker] Received ${signal}, shutting down gracefully...`);

    const workers = [postWorker, replyWorker, dmWorker, engageWorker, scrapeWorker, researchWorker, schedulerWorker];

    await Promise.allSettled(
      workers.map(async (w) => {
        await w.close();
      }),
    );

    console.log('[Worker] All processors stopped');
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  console.log('[Worker] Ready and processing jobs');
}

main().catch((err) => {
  console.error('[Worker] Fatal error:', err);
  process.exit(1);
});
