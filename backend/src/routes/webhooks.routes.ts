import { Router } from 'express';
import webhooksController from '../controllers/webhooks.controller';

const router = Router();

// This route requires raw body parsing which is handled in app.ts or here if specific
router.post('/stripe', webhooksController.handleStripeWebhook);

export default router;
