import { Router } from 'express';
import analyticsController from '../controllers/analytics.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get(
  '/dashboard',
  authorize('admin', 'manager', 'biller', 'rcm_specialist', 'appeals_specialist'),
  analyticsController.getDashboardMetrics,
);

router.get(
  '/denial-trends',
  authorize('admin', 'manager', 'biller', 'rcm_specialist', 'appeals_specialist'),
  analyticsController.getDenialTrends,
);

router.get(
  '/payer-performance',
  authorize('admin', 'manager', 'biller', 'rcm_specialist', 'appeals_specialist'),
  analyticsController.getPayerPerformance,
);

router.get(
  '/provider-performance',
  authorize('admin', 'manager', 'biller', 'rcm_specialist', 'appeals_specialist'),
  analyticsController.getProviderPerformance,
);

router.post(
  '/generate-report',
  authorize('admin', 'manager', 'biller', 'rcm_specialist', 'appeals_specialist'),
  analyticsController.generateReport,
);

export default router;
