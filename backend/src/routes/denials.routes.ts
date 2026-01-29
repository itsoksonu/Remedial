import { Router } from 'express';
import { DenialsController } from '../controllers/denials.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// Denial Rules
router.get('/rules', DenialsController.getRules);
router.post('/rules', DenialsController.createRule);
router.put('/rules/:id', DenialsController.updateRule);

// Analytics
router.get('/analytics', DenialsController.getAnalytics);

export default router;
