import { Router } from 'express';
import { ClaimsController } from '../controllers/claims.controller';
import { authenticate } from '../middleware/auth';
const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// List claims
router.get('/', ClaimsController.getClaims);

// Create claim
router.post('/', ClaimsController.createClaim);

// Export claims (must be before :id)
router.get('/export', ClaimsController.exportClaims);

// Import claims (must be before :id)
// Import claims
router.post('/import', ClaimsController.importClaims);

// Get single claim
router.get('/:id', ClaimsController.getClaimById);

// Update claim
router.put('/:id', ClaimsController.updateClaim);

// Assign claim
router.post('/:id/assign', ClaimsController.assignClaim);

// Add note
router.post('/:id/notes', ClaimsController.addNote);

// Record action
router.post('/:id/actions', ClaimsController.recordAction);

export default router;
