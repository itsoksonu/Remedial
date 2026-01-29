import { Router } from 'express';
import { AppealsController } from '../controllers/appeals.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  createAppealSchema,
  queryAppealsSchema,
  recordAppealResponseSchema,
  submitAppealSchema,
  updateAppealSchema,
} from '../validators/appeals.validator';

const router = Router();

router.use(authenticate);

// GET /appeals - list appeals
router.get('/', validate(queryAppealsSchema), AppealsController.getAppeals);

// GET /appeals/:id - get appeal details
router.get('/:id', AppealsController.getAppealById);

// POST /appeals - create new appeal
router.post('/', validate(createAppealSchema), AppealsController.createAppeal);

// PUT /appeals/:id - update appeal
router.put('/:id', validate(updateAppealSchema), AppealsController.updateAppeal);

// POST /appeals/:id/submit - submit appeal to payer
router.post(
  '/:id/submit',
  validate(submitAppealSchema),
  AppealsController.submitAppeal,
);

// POST /appeals/:id/response - record payer response
router.post(
  '/:id/response',
  validate(recordAppealResponseSchema),
  AppealsController.recordResponse,
);

export default router;

