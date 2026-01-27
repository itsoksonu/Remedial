import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import prisma from '../config/database';
import { logger } from '../utils/logger';

export const auditLog = (action: string, entityType: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const originalJson = res.json.bind(res);

    res.json = function (body: any) {
      // Log after successful response
      if (res.statusCode < 400) {
        prisma.auditLog
          .create({
            data: {
              organizationId: req.user?.organizationId,
              userId: req.user?.id,
              action,
              entityType,
              entityId: body.data?.id || req.params.id,
              ipAddress: req.ip,
              userAgent: req.headers['user-agent'],
              newValues: body.data,
            },
          })
          .catch((err: any) => logger.error('Audit log error:', err));
      }

      return originalJson(body);
    };

    next();
  };
};
