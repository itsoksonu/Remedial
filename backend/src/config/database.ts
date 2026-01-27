import { PrismaClient, Prisma } from '@prisma/client';
import { logger } from '../utils/logger';
import { env } from './env';

import { withAccelerate } from '@prisma/extension-accelerate';

const basePrisma = new PrismaClient({
  log: [
    { level: 'query', emit: 'event' },
    { level: 'error', emit: 'stdout' },
    { level: 'warn', emit: 'stdout' },
  ],
  datasources: {
    db: {
      url: process.env.DIRECT_URL || env.DATABASE_URL,
    },
  },
});

basePrisma.$on('query', (e: any) => {
  if (env.NODE_ENV === 'development') {
    logger.debug(`Query: ${e.query} - Duration: ${e.duration}ms`);
  }
});

// Temporarily bypass Accelerate due to configuration mismatch
// const prisma = basePrisma.$extends(withAccelerate());
const prisma = basePrisma;

export default prisma;
