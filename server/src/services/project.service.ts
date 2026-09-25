import { projectRepository } from '../repositories/project.repository';
import { Project, Role } from '@prisma/client';
import { ForbiddenError, NotFoundError } from '../errors/AppError';
import { AuthenticatedUser } from '../types';

export class ProjectService {
  async getProjectsForUser(user: AuthenticatedUser): Promise<Project[]> {
    return projectRepository.findAllForUser(user.id, user.role as Role);
  }

  async getProjectById(projectId: string, user: AuthenticatedUser): Promise<any> {
    const project = await projectRepository.findById(projectId);
    if (!project) {
      throw new NotFoundError('Project not found');
    }

    // Role boundary checks:
    // Admin has access to all projects
    if (user.role === 'ADMIN') {
      return project;
    }

    // PM can only view projects they created
    if (user.role === 'PROJECT_MANAGER' && project.ownerId !== user.id) {
      throw new ForbiddenError('You can only access projects you created');
    }

    // Developer can only view if they have a task in the project
    if (user.role === 'DEVELOPER') {
      const hasTask = project.tasks.some((t: any) => t.assignedToId === user.id);
      if (!hasTask) {
        throw new ForbiddenError('You do not have access to this project');
      }
    }

    return project;
  }

  async createProject(
    data: { name: string; description?: string; clientId: string },
    user: AuthenticatedUser
  ): Promise<Project> {
    if (user.role !== 'ADMIN' && user.role !== 'PROJECT_MANAGER') {
      throw new ForbiddenError('Only Admins and Project Managers can create projects');
    }

    return projectRepository.create({
      name: data.name,
      description: data.description,
      clientId: data.clientId,
      ownerId: user.id, // Authenticated PM or Admin becomes the owner
    });
  }
}

export const projectService = new ProjectService();
