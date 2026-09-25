import { prisma } from '../config/prisma';
import { Task, TaskStatus, TaskPriority, Role, Prisma } from '@prisma/client';

export interface TaskFilterParams {
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDateFrom?: Date;
  dueDateTo?: Date;
  projectId?: string;
}

export class TaskRepository {
  async findTasksForUser(
    userId: string,
    role: Role,
    filters: TaskFilterParams = {}
  ): Promise<any[]> {
    const where: Prisma.TaskWhereInput = {};

    // 1. Role-based scoping
    if (role === Role.DEVELOPER) {
      where.assignedToId = userId;
    } else if (role === Role.PROJECT_MANAGER) {
      where.project = {
        ownerId: userId,
      };
    }
    // Admin has no ownerId restriction

    // 2. Query filter parameters
    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.priority) {
      where.priority = filters.priority;
    }
    if (filters.projectId) {
      where.projectId = filters.projectId;
    }
    if (filters.dueDateFrom || filters.dueDateTo) {
      where.dueDate = {};
      if (filters.dueDateFrom) {
        where.dueDate.gte = filters.dueDateFrom;
      }
      if (filters.dueDateTo) {
        where.dueDate.lte = filters.dueDateTo;
      }
    }

    // Role-specific sorting requirement:
    // Developer dashboard: "sorted by priority then due date"
    const orderBy: Prisma.TaskOrderByWithRelationInput[] =
      role === Role.DEVELOPER
        ? [{ priority: 'desc' }, { dueDate: 'asc' }]
        : [{ createdAt: 'desc' }];

    return prisma.task.findMany({
      where,
      orderBy,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            ownerId: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        activityLogs: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: {
            user: {
              select: { id: true, name: true, role: true },
            },
          },
        },
      },
    });
  }

  async findById(id: string): Promise<any | null> {
    return prisma.task.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            ownerId: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        activityLogs: {
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: { id: true, name: true, role: true },
            },
          },
        },
      },
    });
  }

  async create(data: {
    title: string;
    description?: string;
    projectId: string;
    assignedToId?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    dueDate: Date;
  }): Promise<Task> {
    const isPastDue = new Date(data.dueDate) < new Date() && data.status !== TaskStatus.DONE;
    return prisma.task.create({
      data: {
        ...data,
        isOverdue: isPastDue,
      },
      include: {
        project: true,
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  async updateStatus(
    taskId: string,
    newStatus: TaskStatus
  ): Promise<Task> {
    return prisma.task.update({
      where: { id: taskId },
      data: {
        status: newStatus,
        isOverdue: newStatus === TaskStatus.DONE ? false : undefined,
      },
      include: {
        project: true,
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  async update(taskId: string, data: Partial<Task>): Promise<Task> {
    return prisma.task.update({
      where: { id: taskId },
      data,
    });
  }

  async findOverdueTasksToUpdate(): Promise<Task[]> {
    const now = new Date();
    return prisma.task.findMany({
      where: {
        dueDate: { lt: now },
        status: { not: TaskStatus.DONE },
        isOverdue: false,
      },
      include: {
        project: true,
      },
    });
  }

  async markTaskAsOverdue(taskId: string): Promise<Task> {
    return prisma.task.update({
      where: { id: taskId },
      data: { isOverdue: true },
    });
  }
}

export const taskRepository = new TaskRepository();
