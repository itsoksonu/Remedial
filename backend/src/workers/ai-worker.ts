import { Worker, Job } from 'bullmq';
import { redis } from '../config/redis';
import aiService from '../services/ai.service';
import { logger } from '../utils/logger';

export const aiWorker = new Worker(
  'ai-analysis',
  async (job: Job) => {
    const { organizationId, claimIds } = job.data;

    logger.info(`Processing batch analysis job for org ${organizationId}`);

    // existing logic
    await aiService.batchAnalyzeClaims(organizationId, claimIds);

    return { processed: claimIds.length };
  },
  { connection: redis },
);

aiWorker.on('completed', (job: Job, result: any) => {
  logger.info(`Job ${job.id} completed:`, result);
});

aiWorker.on('failed', (job: Job | undefined, err: Error) => {
  logger.error(`Job ${job?.id} failed:`, err);
});
