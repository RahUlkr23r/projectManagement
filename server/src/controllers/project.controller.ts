import { Request, Response, NextFunction } from 'express';
import { projectService } from '../services/project.service';
import { sendSuccess } from '../utils/response';
import { UnauthorizedError } from '../errors/AppError';

export class ProjectController {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const projects = await projectService.getProjectsForUser(req.user);
      sendSuccess(res, projects);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const project = await projectService.getProjectById(req.params.id, req.user);
      sendSuccess(res, project);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const project = await projectService.createProject(req.body, req.user);
      sendSuccess(res, project, 201, 'Project created successfully');
    } catch (error) {
      next(error);
    }
  }
}

export const projectController = new ProjectController();
