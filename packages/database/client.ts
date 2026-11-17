/**
 * FrostFlow — Prisma client singleton (survives Next.js hot reloads in dev)
 */
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { __frostflowPrisma?: PrismaClient };

export const prisma: PrismaClient =
  globalForPrisma.__frostflowPrisma ??
  new PrismaClient({
    log: process.env['NODE_ENV'] === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env['NODE_ENV'] !== 'production') {
  globalForPrisma.__frostflowPrisma = prisma;
}
