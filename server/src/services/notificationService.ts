import { prisma } from '../config/database';
import { NotificationTypeVal } from '../config/constants';
import { logger } from '../utils/logger';

export class NotificationService {
  async notify(data: {
    userId: string;
    type: NotificationTypeVal;
    title: string;
    message: string;
    metadata?: Record<string, any>;
  }) {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId: data.userId,
          type: data.type,
          title: data.title,
          message: data.message,
          metadata: data.metadata ? JSON.stringify(data.metadata) : null,
        },
      });
      logger.info(`Notification sent to ${data.userId}: [${data.type}] ${data.title}`);
      return notification;
    } catch (err) {
      logger.error('Failed to create notification:', err);
      return null;
    }
  }

  async getUserNotifications(userId: string, unreadOnly = false) {
    const where: any = { userId };
    if (unreadOnly) {
      where.read = false;
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const unreadCount = await prisma.notification.count({
      where: { userId, read: false },
    });

    return {
      notifications: notifications.map((n) => ({
        ...n,
        metadata: n.metadata ? JSON.parse(n.metadata) : null,
      })),
      unreadCount,
    };
  }

  async markAsRead(id: string, userId: string) {
    return prisma.notification.updateMany({
      where: { id, userId },
      data: { read: true },
    });
  }

  async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  }
}

export const notificationService = new NotificationService();
