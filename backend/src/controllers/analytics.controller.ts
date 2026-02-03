import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import analyticsService from '../services/analytics.service';

class AnalyticsController {
  async getDashboardMetrics(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await analyticsService.getDashboardMetrics(req.user!.organizationId);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getDenialTrends(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await analyticsService.getDenialTrends(req.user!.organizationId);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getPayerPerformance(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await analyticsService.getPayerPerformance(req.user!.organizationId);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getProviderPerformance(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await analyticsService.getProviderPerformance(req.user!.organizationId);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async generateReport(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      // filters: reportType, startDate, endDate, etc.
      const filters = req.body;
      const result = await analyticsService.generateReport(req.user!.organizationId, filters);

      if (typeof result === 'string') {
        // If it's a string, assuming it's CSV content based on current service implementation
        res.header('Content-Type', 'text/csv');
        res.attachment(`report_${filters.reportType}_${Date.now()}.csv`);
        res.send(result);
      } else {
        res.json({
          success: true,
          data: result,
        });
      }
    } catch (error) {
      next(error);
    }
  }
}

export default new AnalyticsController();
