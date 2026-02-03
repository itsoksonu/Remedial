import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import userService from '../services/users.service';
import { AppError } from '../middleware/errorHandler';

export class UserController {
  async getUsers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError('Not authenticated', 401);

      const users = await userService.getOrganizationUsers(req.user.organizationId);

      res.json({
        success: true,
        data: users,
      });
    } catch (error) {
      next(error);
    }
  }

  async createUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError('Not authenticated', 401);

      const user = await userService.createUser(req.user.organizationId, req.body);

      res.status(201).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError('Not authenticated', 401);

      const { id } = req.params;
      const user = await userService.updateUser(id, req.user.organizationId, req.body);

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async deactivateUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError('Not authenticated', 401);

      const { id } = req.params;
      await userService.deactivateUser(id, req.user.organizationId);

      res.json({
        success: true,
        message: 'User deactivated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async getUserActivity(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError('Not authenticated', 401);

      const { id } = req.params;
      const activity = await userService.getUserActivity(id, req.user.organizationId);

      res.json({
        success: true,
        data: activity,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new UserController();
