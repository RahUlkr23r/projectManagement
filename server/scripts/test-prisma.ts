import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({ log: ['query', 'info', 'warn', 'error'] });

async function main() {
  console.log('Connecting to Prisma...');
  await prisma.$connect();
  console.log('Connected! Querying users...');
  const users = await prisma.user.findMany();
  console.log('Found users:', users.length);
}

main().catch(console.error).finally(() => prisma.$disconnect());
