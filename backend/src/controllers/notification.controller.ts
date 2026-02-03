import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { NotificationService } from '../services/notification.service';
import { NotificationType } from '@prisma/client';

const notificationService = new NotificationService();

export class NotificationController {
  /**
   * Get user notifications
   */
  async getNotifications(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const userId = req.user.id;
      const { isRead, type, page, limit } = req.query;

      const result = await notificationService.getUserNotifications(userId, {
        isRead: isRead === 'true' ? true : isRead === 'false' ? false : undefined,
        type: type as NotificationType,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      });

      return res.json({
        success: true,
        data: result.notifications,
        meta: result.meta,
      });
    } catch (error) {
      console.error('Get notifications error:', error);
      return res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
    }
  }

  /**
   * Mark notification as read
   */
  async markRead(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const { id } = req.params;
      const userId = req.user.id;

      const notification = await notificationService.markAsRead(id, userId);

      return res.json({
        success: true,
        message: 'Notification marked as read',
        data: notification,
      });
    } catch (error: any) {
      console.error('Mark read error:', error);
      if (error.message === 'Notification not found') {
        return res.status(404).json({ success: false, message: 'Notification not found' });
      }
      return res.status(500).json({ success: false, message: 'Failed to update notification' });
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllRead(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const userId = req.user.id;
      await notificationService.markAllAsRead(userId);

      return res.json({
        success: true,
        message: 'All notifications marked as read',
      });
    } catch (error) {
      console.error('Mark all read error:', error);
      return res.status(500).json({ success: false, message: 'Failed to update notifications' });
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const { id } = req.params;
      const userId = req.user.id;

      await notificationService.deleteNotification(id, userId);

      return res.json({
        success: true,
        message: 'Notification deleted successfully',
      });
    } catch (error: any) {
      console.error('Delete notification error:', error);
      if (error.message === 'Notification not found') {
        return res.status(404).json({ success: false, message: 'Notification not found' });
      }
      return res.status(500).json({ success: false, message: 'Failed to delete notification' });
    }
  }
}
