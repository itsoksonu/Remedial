import { Request, Response, NextFunction } from 'express';
import DenialsService from '../services/denials.service';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

export class DenialsController {
  static async getRules(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError('Not authenticated', 401);
      const result = await DenialsService.getRules(req.user.organizationId);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async createRule(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError('Not authenticated', 401);
      const result = await DenialsService.createRule(
        req.user.organizationId,
        req.user.id,
        req.body,
      );
      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateRule(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError('Not authenticated', 401);
      const result = await DenialsService.updateRule(
        req.params.id,
        req.user.organizationId,
        req.body,
      );
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAnalytics(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError('Not authenticated', 401);
      const result = await DenialsService.getAnalytics(req.user.organizationId, req.query);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}
