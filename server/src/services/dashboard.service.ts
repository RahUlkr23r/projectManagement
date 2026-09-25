import { prisma } from '../config/prisma';
import { AuthenticatedUser } from '../types';
import { TaskStatus, TaskPriority } from '@prisma/client';
import { wsManager } from '../websocket/ws.manager';

export class DashboardService {
  async getAdminDashboardMetrics(): Promise<any> {
    const [totalProjects, tasksByStatusRaw, overdueCount, totalClients, totalUsers] = await Promise.all([
      prisma.project.count(),
      prisma.task.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
      prisma.task.count({
        where: {
          isOverdue: true,
          status: { not: TaskStatus.DONE },
        },
      }),
      prisma.client.count(),
      prisma.user.count(),
    ]);

    const tasksByStatus: Record<string, number> = {
      TODO: 0,
      IN_PROGRESS: 0,
      IN_REVIEW: 0,
      DONE: 0,
    };

    tasksByStatusRaw.forEach((item) => {
      tasksByStatus[item.status] = item._count.id;
    });

    const onlineUsersCount = wsManager.getOnlineUserCount();

    return {
      totalProjects,
      totalClients,
      totalUsers,
      tasksByStatus,
      overdueCount,
      onlineUsersCount,
    };
  }

  async getPMDashboardMetrics(pmId: string): Promise<any> {
    const startOfWeek = new Date();
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date();
    endOfWeek.setDate(endOfWeek.getDate() + 7);
    endOfWeek.setHours(23, 59, 59, 999);

    const [projects, tasksByPriorityRaw, upcomingTasks, overdueCount] = await Promise.all([
      prisma.project.findMany({
        where: { ownerId: pmId },
        include: {
          client: true,
          _count: {
            select: { tasks: true },
          },
        },
      }),
      prisma.task.groupBy({
        by: ['priority'],
        where: {
          project: { ownerId: pmId },
        },
        _count: { id: true },
      }),
      prisma.task.findMany({
        where: {
          project: { ownerId: pmId },
          dueDate: {
            gte: startOfWeek,
            lte: endOfWeek,
          },
          status: { not: TaskStatus.DONE },
        },
        include: {
          assignedTo: {
            select: { id: true, name: true },
          },
          project: {
            select: { id: true, name: true },
          },
        },
        orderBy: { dueDate: 'asc' },
      }),
      prisma.task.count({
        where: {
          project: { ownerId: pmId },
          isOverdue: true,
          status: { not: TaskStatus.DONE },
        },
      }),
    ]);

    const tasksByPriority: Record<string, number> = {
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
      CRITICAL: 0,
    };

    tasksByPriorityRaw.forEach((item) => {
      tasksByPriority[item.priority] = item._count.id;
    });

    return {
      ownProjectsCount: projects.length,
      projects,
      tasksByPriority,
      upcomingTasksThisWeek: upcomingTasks,
      overdueCount,
    };
  }

  async getDeveloperDashboardMetrics(developerId: string): Promise<any> {
    const [assignedTasks, totalAssigned, inProgressCount, completedCount, overdueCount] =
      await Promise.all([
        prisma.task.findMany({
          where: { assignedToId: developerId },
          orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
          include: {
            project: {
              select: { id: true, name: true },
            },
          },
        }),
        prisma.task.count({
          where: { assignedToId: developerId },
        }),
        prisma.task.count({
          where: { assignedToId: developerId, status: TaskStatus.IN_PROGRESS },
        }),
        prisma.task.count({
          where: { assignedToId: developerId, status: TaskStatus.DONE },
        }),
        prisma.task.count({
          where: {
            assignedToId: developerId,
            isOverdue: true,
            status: { not: TaskStatus.DONE },
          },
        }),
      ]);

    return {
      totalAssigned,
      inProgressCount,
      completedCount,
      overdueCount,
      assignedTasks,
    };
  }

  async getDashboardForUser(user: AuthenticatedUser): Promise<any> {
    if (user.role === 'ADMIN') {
      return this.getAdminDashboardMetrics();
    } else if (user.role === 'PROJECT_MANAGER') {
      return this.getPMDashboardMetrics(user.id);
    } else {
      return this.getDeveloperDashboardMetrics(user.id);
    }
  }
}

export const dashboardService = new DashboardService();
