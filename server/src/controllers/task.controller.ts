import { Request, Response, NextFunction } from 'express';
import { taskService } from '../services/task.service';
import { sendSuccess } from '../utils/response';
import { UnauthorizedError } from '../errors/AppError';
import { TaskStatus, TaskPriority } from '@prisma/client';

export class TaskController {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();

      const { status, priority, dueDateFrom, dueDateTo, projectId } = req.query;

      const filters = {
        status: status as TaskStatus | undefined,
        priority: priority as TaskPriority | undefined,
        dueDateFrom: dueDateFrom ? new Date(dueDateFrom as string) : undefined,
        dueDateTo: dueDateTo ? new Date(dueDateTo as string) : undefined,
        projectId: projectId as string | undefined,
      };

      const tasks = await taskService.getTasks(req.user, filters);
      sendSuccess(res, tasks);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const task = await taskService.getTaskById(req.params.id, req.user);
      sendSuccess(res, task);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const task = await taskService.createTask(req.body, req.user);
      sendSuccess(res, task, 201, 'Task created successfully');
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const { status } = req.body;
      const updatedTask = await taskService.updateTaskStatus(req.params.id, status, req.user);
      sendSuccess(res, updatedTask, 200, 'Task status updated');
    } catch (error) {
      next(error);
    }
  }
}

export const taskController = new TaskController();
