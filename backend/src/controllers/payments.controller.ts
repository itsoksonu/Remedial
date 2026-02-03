import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import paymentsService from '../services/payments.service';

class PaymentsController {
  async getPayments(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await paymentsService.findAll(req.user!.organizationId, req.query);
      res.json({
        success: true,
        data: result.payments,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  async postPayment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const payment = await paymentsService.create(
        req.user!.organizationId,
        req.user!.id,
        req.body,
      );
      res.status(201).json({
        success: true,
        data: payment,
      });
    } catch (error) {
      next(error);
    }
  }

  async verifyPayment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const payment = await paymentsService.verify(id, req.user!.organizationId, req.user!.id);
      res.json({
        success: true,
        data: payment,
      });
    } catch (error) {
      next(error);
    }
  }

  async getPaymentSummary(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await paymentsService.getSummary(req.user!.organizationId, req.query);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new PaymentsController();
