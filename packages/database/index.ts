/**
 * FrostFlow — Database Package
 * Exports the Prisma client, Prisma types and all domain queries.
 */
export { prisma } from './client';
export * from '@prisma/client';

export * as users from './queries/users';
export * as jobs from './queries/jobs';
export * as results from './queries/results';
export * as reports from './queries/reports';
export * as monitors from './queries/monitors';
export * as usage from './queries/usage';
