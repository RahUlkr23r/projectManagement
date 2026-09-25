import { prisma } from '../config/prisma';
import { Client } from '@prisma/client';

export class ClientRepository {
  async findAll(): Promise<Client[]> {
    return prisma.client.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { projects: true },
        },
      },
    });
  }

  async findById(id: string): Promise<Client | null> {
    return prisma.client.findUnique({
      where: { id },
      include: { projects: true },
    });
  }

  async create(data: { name: string; email: string; company?: string }): Promise<Client> {
    return prisma.client.create({
      data,
    });
  }
}

export const clientRepository = new ClientRepository();
