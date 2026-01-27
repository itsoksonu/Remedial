import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { env } from '../config/env';
import { logger } from '../utils/logger';

export const initSockets = (httpServer: HttpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: '*', // Adjust validation based on env later
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};
