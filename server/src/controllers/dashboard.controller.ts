import { Request, Response, NextFunction } from 'express';
import { dashboardService } from '../services/dashboard.service';
import { sendSuccess } from '../utils/response';
import { UnauthorizedError } from '../errors/AppError';

export class DashboardController {
  async getMetrics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const metrics = await dashboardService.getDashboardForUser(req.user);
      sendSuccess(res, metrics);
    } catch (error) {
      next(error);
    }
  }
}

export const dashboardController = new DashboardController();
