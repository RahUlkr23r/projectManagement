import { prisma } from '../config/prisma';
import { Project, Role } from '@prisma/client';

export class ProjectRepository {
  async findAllForUser(userId: string, role: Role): Promise<Project[]> {
    if (role === Role.ADMIN) {
      return prisma.project.findMany({
        include: {
          client: true,
          owner: {
            select: { id: true, name: true, email: true },
          },
          _count: {
            select: { tasks: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (role === Role.PROJECT_MANAGER) {
      return prisma.project.findMany({
        where: { ownerId: userId },
        include: {
          client: true,
          owner: {
            select: { id: true, name: true, email: true },
          },
          _count: {
            select: { tasks: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    // Developer: projects where developer has assigned tasks
    return prisma.project.findMany({
      where: {
        tasks: {
          some: {
            assignedToId: userId,
          },
        },
      },
      include: {
        client: true,
        owner: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { tasks: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string): Promise<any | null> {
    return prisma.project.findUnique({
      where: { id },
      include: {
        client: true,
        owner: {
          select: { id: true, name: true, email: true },
        },
        tasks: {
          include: {
            assignedTo: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async create(data: { name: string; description?: string; clientId: string; ownerId: string }): Promise<Project> {
    return prisma.project.create({
      data,
      include: {
        client: true,
        owner: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  async isOwner(projectId: string, userId: string): Promise<boolean> {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { ownerId: true },
    });
    return project?.ownerId === userId;
  }
}

export const projectRepository = new ProjectRepository();
