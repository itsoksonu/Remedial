import { Router } from 'express';
import { OrganizationsController } from '../controllers/organizations.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Apply authentication to all routes for now
router.use(authenticate);

// List all organizations (Admin only)
router.get('/', OrganizationsController.listOrganizations);

// Create a new organization
router.post('/', OrganizationsController.createOrganization);

// Get a specific organization
router.get('/:id', OrganizationsController.getOrganization);

// Update an organization
router.put('/:id', OrganizationsController.updateOrganization);

// Delete an organization (Soft delete)
router.delete('/:id', OrganizationsController.deleteOrganization);

export default router;
