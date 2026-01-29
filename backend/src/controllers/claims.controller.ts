import { Request, Response, NextFunction } from 'express';
import ClaimsService from '../services/claims.service';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

export class ClaimsController {
  static async getClaims(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError('Not authenticated', 401);
      const result = await ClaimsService.findAll(req.user.organizationId, req.query);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getClaimById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError('Not authenticated', 401);
      const result = await ClaimsService.findById(req.params.id, req.user.organizationId);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async createClaim(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError('Not authenticated', 401);
      const result = await ClaimsService.create(req.user.organizationId, req.body);
      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateClaim(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError('Not authenticated', 401);
      const result = await ClaimsService.update(req.params.id, req.user.organizationId, req.body);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async assignClaim(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError('Not authenticated', 401);
      const { userId } = req.body;
      if (!userId) throw new AppError('User ID is required', 400);

      const result = await ClaimsService.assign(
        req.params.id,
        req.user.organizationId,
        userId,
        req.user.id,
      );
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async addNote(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError('Not authenticated', 401);
      const result = await ClaimsService.addNote(
        req.params.id,
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

  static async recordAction(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError('Not authenticated', 401);
      const result = await ClaimsService.recordAction(
        req.params.id,
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

  static async importClaims(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError('Not authenticated', 401);
      if (!req.file) throw new AppError('No file uploaded', 400);

      // req.file.buffer is available if using memory storage
      // If disk storage, fs.readFileSync(req.file.path)
      // Assuming memory storage for simplicity in routes

      const buffer = req.file.buffer;
      if (!buffer) throw new AppError('File buffer is empty', 400);

      const result = await ClaimsService.importClaims(req.user.organizationId, buffer);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async exportClaims(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError('Not authenticated', 401);
      const csv = await ClaimsService.exportClaims(req.user.organizationId, req.query);

      res.header('Content-Type', 'text/csv');
      res.attachment('claims.csv');
      res.send(csv);
    } catch (error) {
      next(error);
    }
  }
}
