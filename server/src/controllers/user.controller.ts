import { Request, Response, NextFunction } from 'express';
import { userService } from '../services/user.service';
import { sendSuccess } from '../utils/response';
import { Role } from '@prisma/client';

export class UserController {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const role = req.query.role as Role | undefined;
      const users = await userService.getAllUsers(role);
      sendSuccess(res, users);
    } catch (error) {
      next(error);
    }
  }

  async getDevelopers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const developers = await userService.getDevelopers();
      sendSuccess(res, developers);
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();
