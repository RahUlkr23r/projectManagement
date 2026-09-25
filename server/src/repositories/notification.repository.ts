import { prisma } from '../config/prisma';
import { Notification, NotificationType } from '@prisma/client';

export class NotificationRepository {
  async createNotification(data: {
    userId: string;
    taskId?: string;
    type: NotificationType;
    title: string;
    message: string;
  }): Promise<Notification> {
    return prisma.notification.create({
      data,
      include: {
        task: {
          select: { id: true, title: true, taskNumber: true },
        },
      },
    });
  }

  async findForUser(userId: string, limit = 30): Promise<Notification[]> {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        task: {
          select: { id: true, title: true, taskNumber: true },
        },
      },
    });
  }

  async getUnreadCount(userId: string): Promise<number> {
    return prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
  }

  async markAsRead(id: string, userId: string): Promise<Notification> {
    return prisma.notification.update({
      where: { id, userId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string): Promise<void> {
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }
}

export const notificationRepository = new NotificationRepository();
