import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { logger } from '../utils/logger';

interface AuthPayload {
  type: 'auth';
  token: string;
}

export class SocketService {
  private static instance: SocketService;
  private io: Server | null = null;

  private constructor() {}

  public static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  public init(httpServer: HttpServer): void {
    this.io = new Server(httpServer, {
      cors: {
        origin: '*', // Adjust for production
        methods: ['GET', 'POST'],
      },
      pingTimeout: 60000,
    });

    this.io.on('connection', (socket: Socket) => {
      logger.info(`Socket connected: ${socket.id}`);

      // Handle Authentication
      socket.on('auth', async (payload: AuthPayload) => {
        try {
          if (payload.type !== 'auth' || !payload.token) {
            logger.warn(`Invalid auth payload from socket ${socket.id}`);
            socket.emit('error', { message: 'Invalid authentication payload' });
            return;
          }

          const decoded = jwt.verify(payload.token, env.JWT_SECRET) as {
            userId: string;
            role: string;
          };

          // Join user-specific room
          const userRoom = `user:${decoded.userId}`;
          await socket.join(userRoom);

          // Join role-specific room (optional, but good for admin broadcasts)
          // await socket.join(`role:${decoded.role}`);

          logger.info(`Socket ${socket.id} authenticated as user ${decoded.userId}`);
          socket.emit('auth:success', { message: 'Authenticated successfully' });
        } catch (error) {
          logger.error(`Socket authentication failed for ${socket.id}`, error);
          socket.emit('auth:error', { message: 'Authentication failed' });
          socket.disconnect(true);
        }
      });

      socket.on('disconnect', () => {
        logger.info(`Socket disconnected: ${socket.id}`);
      });
    });

    logger.info('Socket.io initialized');
  }

  public emitToUser(userId: string, event: string, data: any): void {
    if (!this.io) {
      logger.warn('Socket.io not initialized. Cannot emit event.');
      return;
    }

    // Construct the payload as requested: { type: event, data: data }
    // The user wants: json{ "type": "event_name", "data": ... }
    const payload = {
      type: event,
      data: data,
    };

    this.io.to(`user:${userId}`).emit(event, payload);
  }

  public broadcast(event: string, data: any): void {
    if (!this.io) {
      logger.warn('Socket.io not initialized. Cannot broadcast event.');
      return;
    }

    const payload = {
      type: event,
      data: data,
    };

    this.io.emit(event, payload);
  }
}

export const socketService = SocketService.getInstance();
