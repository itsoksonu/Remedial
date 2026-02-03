import { Router } from 'express';
import paymentsController from '../controllers/payments.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  authorize('admin', 'manager', 'biller', 'rcm_specialist'),
  paymentsController.getPayments,
);
router.post('/', authorize('admin', 'manager', 'biller'), paymentsController.postPayment);
router.put(
  '/:id/verify',
  authorize('admin', 'manager', 'rcm_specialist'),
  paymentsController.verifyPayment,
);
router.get(
  '/summary',
  authorize('admin', 'manager', 'biller', 'rcm_specialist'),
  paymentsController.getPaymentSummary,
);

export default router;
