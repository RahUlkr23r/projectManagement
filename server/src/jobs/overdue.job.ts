import cron from 'node-cron';
import { taskRepository } from '../repositories/task.repository';
import { notificationRepository } from '../repositories/notification.repository';
import { NotificationType } from '@prisma/client';
import { wsManager } from '../websocket/ws.manager';

export const startOverdueTaskJob = (): cron.ScheduledTask => {
  // Runs every minute to identify and transition overdue tasks
  const job = cron.schedule('* * * * *', async () => {
    try {
      const overdueTasks = await taskRepository.findOverdueTasksToUpdate();

      if (overdueTasks.length === 0) {
        return;
      }

      console.log(`⏱️ [OVERDUE_JOB] Found ${overdueTasks.length} newly overdue tasks. Flagging...`);

      for (const task of overdueTasks) {
        await taskRepository.markTaskAsOverdue(task.id);

        // Notify assigned developer if one is assigned
        if (task.assignedToId) {
          const notification = await notificationRepository.createNotification({
            userId: task.assignedToId,
            taskId: task.id,
            type: NotificationType.TASK_OVERDUE,
            title: 'Task Overdue Notice',
            message: `Task #${task.taskNumber} ("${task.title}") has passed its due date and is now overdue.`,
          });

          const unreadCount = await notificationRepository.getUnreadCount(task.assignedToId);

          wsManager.sendNotification(task.assignedToId, {
            id: notification.id,
            userId: notification.userId,
            title: notification.title,
            message: notification.message,
            type: notification.type,
            isRead: notification.isRead,
            createdAt: notification.createdAt.toISOString(),
            unreadCount,
          });
        }
      }
    } catch (error) {
      console.error('❌ [OVERDUE_JOB_ERROR]', error);
    }
  });

  console.log('⏰ Overdue Task cron scheduler initialized (frequency: 1 minute)');
  return job;
};
