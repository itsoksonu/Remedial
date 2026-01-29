import { Response, NextFunction } from 'express';
import AppealsService from '../services/appeals.service';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

export class AppealsController {
  static async getAppeals(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError('Not authenticated', 401);
      const result = await AppealsService.findAll(req.user.organizationId, req.query);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAppealById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError('Not authenticated', 401);
      const result = await AppealsService.findById(req.params.id, req.user.organizationId);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async createAppeal(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError('Not authenticated', 401);
      const result = await AppealsService.create(
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

  static async updateAppeal(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError('Not authenticated', 401);
      const result = await AppealsService.update(
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

  static async submitAppeal(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError('Not authenticated', 401);
      const result = await AppealsService.submit(
        req.params.id,
        req.user.organizationId,
        req.user.id,
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

  static async recordResponse(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError('Not authenticated', 401);
      const result = await AppealsService.recordResponse(
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
}

