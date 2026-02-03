import express from 'express';
import userController from '../controllers/users.controller';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '@prisma/client';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// Apply admin authorization to all routes
// Only admins should be able to manage users
router.use(authorize(UserRole.admin));

router.get('/', userController.getUsers);
router.post('/', userController.createUser);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deactivateUser);
router.get('/:id/activity', userController.getUserActivity);

export default router;
