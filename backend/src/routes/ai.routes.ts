import { Router } from 'express';
import aiController from '../controllers/ai.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Analyze single claim
router.post('/analyze/:id', aiController.analyzeClaim);

// Batch analyze multiple claims
router.post('/batch-analyze', 
  authorize('admin', 'manager'),
  aiController.batchAnalyze
);

// Generate appeal letter
router.post('/appeal-letter/:id', aiController.generateAppealLetter);

// Predict denial risk
router.post('/predict-risk', aiController.predictDenialRisk);

// Chat with AI advisor
router.post('/chat', aiController.chat);

export default router;