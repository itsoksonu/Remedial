import { PrismaClient, Notification, NotificationType, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export class NotificationService {
  /**
   * Get notifications for a user
   */
  async getUserNotifications(
    userId: string,
    filters: {
      isRead?: boolean;
      type?: NotificationType;
      page?: number;
      limit?: number;
    },
  ) {
    const { isRead, type, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.NotificationWhereInput = {
      userId,
      ...(isRead !== undefined && { isRead }),
      ...(type && { type }),
    };

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          claim: {
            select: {
              id: true,
              claimNumber: true,
            },
          },
          appeal: {
            select: {
              id: true,
              appealNumber: true,
            },
          },
        },
      }),
      prisma.notification.count({ where }),
    ]);

    return {
      notifications,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(id: string, userId: string): Promise<Notification> {
    const notification = await prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    if (notification.isRead) {
      return notification;
    }

    return prisma.notification.update({
      where: { id },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<Prisma.BatchPayload> {
    return prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  /**
   * Delete a notification
   */
  async deleteNotification(id: string, userId: string): Promise<Notification> {
    const notification = await prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    return prisma.notification.delete({
      where: { id },
    });
  }
}
