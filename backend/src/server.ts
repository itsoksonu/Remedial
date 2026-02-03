import { createServer } from 'http';
import app from './app';
import { env } from './config/env';
import { logger } from './utils/logger';

import prisma from './config/database';

import { socketService } from './services/socket.service';

const server = createServer(app);

// Initialize Socket.IO
socketService.init(server);

// Database connection check
prisma
  .$connect()
  .then(() => logger.info('Database connected successfully'))
  .catch((err: any) => logger.error('Database connection failed', err));

server.listen(env.PORT, () => {
  logger.info(`Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received. Shutting down gracefully');
  await prisma.$disconnect();
  server.close(() => {
    process.exit(0);
  });
});
