import { clientRepository } from '../repositories/client.repository';
import { Client } from '@prisma/client';
import { BadRequestError } from '../errors/AppError';

export class ClientService {
  async getAllClients(): Promise<Client[]> {
    return clientRepository.findAll();
  }

  async createClient(data: { name: string; email: string; company?: string }): Promise<Client> {
    if (!data.name || !data.email) {
      throw new BadRequestError('Client name and email are required');
    }
    return clientRepository.create(data);
  }
}

export const clientService = new ClientService();
