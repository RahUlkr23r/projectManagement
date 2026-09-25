import { taskRepository, TaskFilterParams } from '../repositories/task.repository';
import { projectRepository } from '../repositories/project.repository';
import { activityRepository } from '../repositories/activity.repository';
import { notificationRepository } from '../repositories/notification.repository';
import { Task, TaskStatus, TaskPriority, Role, NotificationType } from '@prisma/client';
import { ForbiddenError, NotFoundError, BadRequestError } from '../errors/AppError';
import { AuthenticatedUser } from '../types';
import { wsManager } from '../websocket/ws.manager';

export class TaskService {
  async getTasks(user: AuthenticatedUser, filters: TaskFilterParams): Promise<any[]> {
    return taskRepository.findTasksForUser(user.id, user.role as Role, filters);
  }

  async getTaskById(taskId: string, user: AuthenticatedUser): Promise<any> {
    const task = await taskRepository.findById(taskId);
    if (!task) {
      throw new NotFoundError('Task not found');
    }

    // Role-based boundary enforcement
    if (user.role === 'DEVELOPER' && task.assignedToId !== user.id) {
      throw new ForbiddenError('You can only access tasks assigned to you');
    }

    if (user.role === 'PROJECT_MANAGER' && task.project.ownerId !== user.id) {
      throw new ForbiddenError('You can only access tasks within projects you manage');
    }

    return task;
  }

  async createTask(
    data: {
      title: string;
      description?: string;
      projectId: string;
      assignedToId?: string;
      priority?: TaskPriority;
      dueDate: string;
    },
    user: AuthenticatedUser
  ): Promise<Task> {
    // Only Admin or PM who owns the project can create tasks
    const project = await projectRepository.findById(data.projectId);
    if (!project) {
      throw new NotFoundError('Project not found');
    }

    if (user.role === 'PROJECT_MANAGER' && project.ownerId !== user.id) {
      throw new ForbiddenError('You can only create tasks for projects you manage');
    }

    if (user.role === 'DEVELOPER') {
      throw new ForbiddenError('Developers cannot create tasks');
    }

    const dueDate = new Date(data.dueDate);
    if (isNaN(dueDate.getTime())) {
      throw new BadRequestError('Invalid due date provided');
    }

    const task = await taskRepository.create({
      title: data.title,
      description: data.description,
      projectId: data.projectId,
      assignedToId: data.assignedToId || undefined,
      priority: data.priority || TaskPriority.MEDIUM,
      dueDate,
    });

    // Notify assigned developer if specified
    if (task.assignedToId) {
      const notif = await notificationRepository.createNotification({
        userId: task.assignedToId,
        taskId: task.id,
        type: NotificationType.TASK_ASSIGNED,
        title: 'New Task Assigned',
        message: `You were assigned to "${task.title}"`,
      });

      const unreadCount = await notificationRepository.getUnreadCount(task.assignedToId);
      wsManager.sendNotification(task.assignedToId, {
        id: notif.id,
        userId: notif.userId,
        title: notif.title,
        message: notif.message,
        type: notif.type,
        isRead: notif.isRead,
        createdAt: notif.createdAt.toISOString(),
        unreadCount,
      });
    }

    // Broadcast board update
    wsManager.broadcastTaskUpdate(project.id, task);

    return task;
  }

  async updateTaskStatus(
    taskId: string,
    newStatus: TaskStatus,
    user: AuthenticatedUser
  ): Promise<any> {
    const existingTask = await taskRepository.findById(taskId);
    if (!existingTask) {
      throw new NotFoundError('Task not found');
    }

    // Role-based authorization:
    // Developer can only update status of their assigned tasks
    if (user.role === 'DEVELOPER' && existingTask.assignedToId !== user.id) {
      throw new ForbiddenError('You can only update tasks assigned to you');
    }

    // PM can only update status of tasks in their owned projects
    if (user.role === 'PROJECT_MANAGER' && existingTask.project.ownerId !== user.id) {
      throw new ForbiddenError('You can only update tasks in projects you manage');
    }

    const previousStatus = existingTask.status;

    // Avoid duplicate logging if status hasn't changed
    if (previousStatus === newStatus) {
      return existingTask;
    }

    // 1. Update task in database
    const updatedTask = await taskRepository.updateStatus(taskId, newStatus);

    // 2. Format human-readable activity log: "Ravi moved Task #12 from In Progress -> In Review"
    const message = `${user.name} moved Task #${existingTask.taskNumber} from ${previousStatus} -> ${newStatus}`;

    // 3. Persist ActivityLog record in PostgreSQL
    const activityLog = await activityRepository.createLog({
      taskId: existingTask.id,
      projectId: existingTask.projectId,
      userId: user.id,
      previousStatus,
      newStatus,
      message,
    });

    // 4. Check if task moved to IN_REVIEW: notify PM who owns the project
    if (newStatus === TaskStatus.IN_REVIEW && existingTask.project.ownerId !== user.id) {
      const pmId = existingTask.project.ownerId;
      const notif = await notificationRepository.createNotification({
        userId: pmId,
        taskId: existingTask.id,
        type: NotificationType.TASK_IN_REVIEW,
        title: 'Task Ready for Review',
        message: `Task #${existingTask.taskNumber} ("${existingTask.title}") is ready for your review.`,
      });

      const unreadCount = await notificationRepository.getUnreadCount(pmId);
      wsManager.sendNotification(pmId, {
        id: notif.id,
        userId: notif.userId,
        title: notif.title,
        message: notif.message,
        type: notif.type,
        isRead: notif.isRead,
        createdAt: notif.createdAt.toISOString(),
        unreadCount,
      });
    }

    // 5. Broadcast real-time activity feed strictly role-filtered
    wsManager.broadcastActivity({
      activityId: activityLog.id,
      taskId: existingTask.id,
      taskNumber: existingTask.taskNumber,
      taskTitle: existingTask.title,
      projectId: existingTask.projectId,
      projectName: existingTask.project.name,
      projectOwnerId: existingTask.project.ownerId,
      assignedToId: existingTask.assignedToId,
      userId: user.id,
      userName: user.name,
      previousStatus,
      newStatus,
      message,
      createdAt: activityLog.createdAt.toISOString(),
    });

    // 6. Broadcast task update to all viewers of the project
    wsManager.broadcastTaskUpdate(existingTask.projectId, updatedTask);

    return updatedTask;
  }
}

export const taskService = new TaskService();
