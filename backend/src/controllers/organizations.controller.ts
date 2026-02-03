import { Request, Response, NextFunction } from 'express';
import OrganizationsService from '../services/organizations.service';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

export class OrganizationsController {
  static async createOrganization(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      // Potentially restricted to admin or specific roles,
      // but for now allowing authenticated users or maybe public if it's registration
      // Assuming public registration might be handled elsewhere or this is for admin creating orgs.
      // If it's pure creation, maybe we don't strictly need auth if it's a signup flow?
      // But let's assume authenticated admin for now based on typical patterns.
      if (!req.user) throw new AppError('Not authenticated', 401);

      const result = await OrganizationsService.createOrganization(req.body);
      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getOrganization(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError('Not authenticated', 401);

      const { id } = req.params;
      // Access control: User should belong to the org or be super admin
      if (req.user.organizationId !== id && req.user.role !== 'admin') {
        throw new AppError('Not authorized to view this organization', 403);
      }

      const result = await OrganizationsService.getOrganizationById(id);
      if (!result) throw new AppError('Organization not found', 404);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateOrganization(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError('Not authenticated', 401);
      const { id } = req.params;

      if (req.user.organizationId !== id && req.user.role !== 'admin') {
        throw new AppError('Not authorized to update this organization', 403);
      }

      const result = await OrganizationsService.updateOrganization(id, req.body);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteOrganization(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError('Not authenticated', 401);
      const { id } = req.params;

      // Only admin can delete?
      if (req.user.role !== 'admin') {
        throw new AppError('Not authorized to delete organization', 403);
      }

      const result = await OrganizationsService.deleteOrganization(id);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async listOrganizations(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError('Not authenticated', 401);
      // Only admin can list all?
      if (req.user.role !== 'admin') {
        throw new AppError('Not authorized to list organizations', 403);
      }

      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;

      const result = await OrganizationsService.getAllOrganizations(page, limit);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}
