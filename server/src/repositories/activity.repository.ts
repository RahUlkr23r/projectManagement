import { prisma } from '../config/prisma';
import { ActivityLog, TaskStatus, Role, Prisma } from '@prisma/client';

export class ActivityRepository {
  async createLog(data: {
    taskId: string;
    projectId: string;
    userId: string;
    previousStatus?: TaskStatus | null;
    newStatus: TaskStatus;
    message: string;
  }): Promise<ActivityLog> {
    return prisma.activityLog.create({
      data: {
        taskId: data.taskId,
        projectId: data.projectId,
        userId: data.userId,
        previousStatus: data.previousStatus,
        newStatus: data.newStatus,
        message: data.message,
      },
      include: {
        user: {
          select: { id: true, name: true, role: true },
        },
        task: {
          select: { id: true, title: true, taskNumber: true },
        },
        project: {
          select: { id: true, name: true },
        },
      },
    });
  }

  async findRecentActivityForUser(
    userId: string,
    role: Role,
    limit = 20,
    projectId?: string
  ): Promise<any[]> {
    const where: Prisma.ActivityLogWhereInput = {};

    if (projectId) {
      where.projectId = projectId;
    }

    if (role === Role.DEVELOPER) {
      // Developer sees activity only on tasks assigned to them
      where.task = {
        assignedToId: userId,
      };
    } else if (role === Role.PROJECT_MANAGER) {
      // PM sees activity only from their own projects
      where.project = {
        ownerId: userId,
      };
    }
    // Admin sees activity across all projects

    return prisma.activityLog.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, role: true },
        },
        task: {
          select: { id: true, title: true, taskNumber: true },
        },
        project: {
          select: { id: true, name: true },
        },
      },
    });
  }
}

export const activityRepository = new ActivityRepository();
