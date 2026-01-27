import { Queue } from 'bullmq';
import { redis } from '../config/redis';

export const aiQueue = new Queue('ai-analysis', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});
