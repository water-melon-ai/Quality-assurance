/**
 * FrostFlow — Database Query Functions: Jobs
 * All job (test run) related database operations
 */

import { prisma } from '../client';
import type { JobStatus, Tier } from '@prisma/client';


// ─── Create ───────────────────────────────────────────────────────────────────

export async function createJob(data: {
  url: string;
  tier: Tier;
  userId?: string | null;
}) {
  return prisma.job.create({
    data: {
      url: data.url,
      tier: data.tier,
      userId: data.userId ?? null,
      status: 'queued',
      progress: 0,
    },
  });
}

// ─── Find ─────────────────────────────────────────────────────────────────────

export async function getJobById(jobId: string) {
  return prisma.job.findUnique({
    where: { id: jobId },
    include: { result: true },
  });
}

export async function getJobsByUser(
  userId: string,
  limit = 20,
  offset = 0
) {
  return prisma.job.findMany({
    where: { userId },
    include: {
      result: {
        select: {
          id: true,
          score: true,
          grade: true,
          criticalCount: true,
          highCount: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
  });
}

export async function getJobStatus(jobId: string) {
  return prisma.job.findUnique({
    where: { id: jobId },
    select: {
      id: true,
      url: true,
      status: true,
      progress: true,
      error: true,
      result: {
        select: { id: true },
      },
    },
  });
}

// ─── Update ───────────────────────────────────────────────────────────────────

export async function updateJobStatus(
  jobId: string,
  status: JobStatus,
  progress?: number
) {
  return prisma.job.update({
    where: { id: jobId },
    data: {
      status,
      ...(progress !== undefined ? { progress } : {}),
      ...(status === 'done' || status === 'failed' ? { completedAt: new Date() } : {}),
    },
  });
}

export async function updateJobProgress(
  jobId: string,
  progress: number,
  pagesCrawled?: number
) {
  return prisma.job.update({
    where: { id: jobId },
    data: {
      progress,
      ...(pagesCrawled !== undefined ? { pagesCrawled } : {}),
    },
  });
}

export async function failJob(jobId: string, error: string) {
  return prisma.job.update({
    where: { id: jobId },
    data: {
      status: 'failed',
      error,
      completedAt: new Date(),
    },
  });
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export async function countUserJobsToday(userId: string) {
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);

  return prisma.job.count({
    where: {
      userId,
      createdAt: { gte: startOfDay },
    },
  });
}

export async function getTotalJobCount() {
  return prisma.job.count();
}

export async function getRecentJobsForDashboard(userId: string) {
  return prisma.job.findMany({
    where: { userId },
    include: {
      result: {
        select: {
          id: true,
          score: true,
          grade: true,
          criticalCount: true,
          highCount: true,
          loadTimeMs: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });
}
