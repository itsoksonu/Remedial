import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError } from '../middleware/errorHandler';
import { UserRole } from '@prisma/client';
import prisma from '../config/database';
import { redis } from '../config/redis';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    organizationId: string;
  };
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      throw new AppError('No token provided', 401);
    }

    // Check if token is blacklisted
    const isBlacklisted = await redis.get(`blacklist:${token}`);
    if (isBlacklisted) {
      throw new AppError('Token is invalid', 401);
    }

    const decoded = jwt.verify(token, env.JWT_SECRET!) as any;

    // Check if session exists
    const session = await prisma.userSession.findFirst({
      where: {
        userId: decoded.userId,
        expiresAt: { gte: new Date() },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            organizationId: true,
            isActive: true,
          },
        },
      },
    });

    if (!session || !session.user.isActive) {
      throw new AppError('Invalid session', 401);
    }

    req.user = session.user;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError('Invalid token', 401));
    } else {
      next(error);
    }
  }
};

export const authorize = (...roles: (string | UserRole)[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Not authenticated', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError('Insufficient permissions', 403));
    }

    next();
  };
};
