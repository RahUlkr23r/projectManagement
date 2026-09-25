import { notificationRepository } from '../repositories/notification.repository';
import { Notification } from '@prisma/client';

export class NotificationService {
  async getNotifications(userId: string): Promise<Notification[]> {
    return notificationRepository.findForUser(userId);
  }

  async getUnreadCount(userId: string): Promise<number> {
    return notificationRepository.getUnreadCount(userId);
  }

  async markAsRead(notificationId: string, userId: string): Promise<Notification> {
    return notificationRepository.markAsRead(notificationId, userId);
  }

  async markAllAsRead(userId: string): Promise<void> {
    return notificationRepository.markAllAsRead(userId);
  }
}

export const notificationService = new NotificationService();
