import { UserRole } from '@prisma/client';
import { AppError } from './errorHandler';
import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

export const authorize = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Not authenticated', 401));
    }

    if (!roles.includes(req.user.role as UserRole)) {
      return next(new AppError('Insufficient permissions', 403));
    }

    next();
  };
};