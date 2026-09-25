import { Request, Response, NextFunction } from 'express';
import { activityService } from '../services/activity.service';
import { sendSuccess } from '../utils/response';
import { UnauthorizedError } from '../errors/AppError';

export class ActivityController {
  async getRecent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();

      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const projectId = req.query.projectId as string | undefined;

      const activities = await activityService.getRecentActivity(req.user, limit, projectId);
      sendSuccess(res, activities);
    } catch (error) {
      next(error);
    }
  }
}

export const activityController = new ActivityController();
