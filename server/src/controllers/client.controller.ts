import { Request, Response, NextFunction } from 'express';
import { clientService } from '../services/client.service';
import { sendSuccess } from '../utils/response';

export class ClientController {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const clients = await clientService.getAllClients();
      sendSuccess(res, clients);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const client = await clientService.createClient(req.body);
      sendSuccess(res, client, 201, 'Client created successfully');
    } catch (error) {
      next(error);
    }
  }
}

export const clientController = new ClientController();
