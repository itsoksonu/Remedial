import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';
import { authenticate } from '../middleware/auth';

const router = Router();
const notificationController = new NotificationController();

// Apply authentication middleware to all routes
router.use(authenticate);

// Get notifications
router.get('/', notificationController.getNotifications);

// Mark all as read
router.put('/mark-all-read', notificationController.markAllRead);

// Mark single notification as read
router.put('/:id/read', notificationController.markRead);

// Delete notification
router.delete('/:id', notificationController.deleteNotification);

export default router;
