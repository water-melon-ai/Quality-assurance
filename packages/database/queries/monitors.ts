/**
 * FrostFlow — Database Query Functions: Monitors
 * Agency-tier scheduled monitoring
 */

import { prisma } from '../client';
import type { MonitorSchedule } from '@prisma/client';


// ─── Create ───────────────────────────────────────────────────────────────────

export async function createMonitor(data: {
  userId: string;
  url: string;
  schedule?: MonitorSchedule;
  alertEmail?: string | null;
  slackWebhook?: string | null;
  alertOnScoreDrop?: number;
}) {
  return prisma.monitor.create({
    data: {
      userId:          data.userId,
      url:             data.url,
      schedule:        data.schedule ?? 'every_6h',
      alertEmail:      data.alertEmail ?? null,
      slackWebhook:    data.slackWebhook ?? null,
      alertOnScoreDrop: data.alertOnScoreDrop ?? 10,
      active:          true,
    },
  });
}

// ─── Find ─────────────────────────────────────────────────────────────────────

export async function getMonitorById(monitorId: string) {
  return prisma.monitor.findUnique({
    where: { id: monitorId },
    include: {
      history: {
        orderBy: { runAt: 'desc' },
        take: 30,
      },
    },
  });
}

export async function getMonitorsByUser(userId: string) {
  return prisma.monitor.findMany({
    where: { userId },
    include: {
      history: {
        orderBy: { runAt: 'desc' },
        take: 10, // Last 10 for sparkline chart
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

/** Get all active monitors due to run now (for the scheduler cron) */
export async function getDueMonitors(schedule: MonitorSchedule) {
  const cutoffs: Record<MonitorSchedule, number> = {
    every_6h:  6  * 60 * 60 * 1000,
    every_12h: 12 * 60 * 60 * 1000,
    every_24h: 24 * 60 * 60 * 1000,
  };

  const cutoff = new Date(Date.now() - cutoffs[schedule] + 60_000); // 1 min grace so runs don't drift

  return prisma.monitor.findMany({
    where: {
      active:   true,
      schedule,
      OR: [
        { lastRunAt: null },
        { lastRunAt: { lte: cutoff } },
      ],
    },
  });
}

// ─── Update ───────────────────────────────────────────────────────────────────

export async function updateMonitorAfterRun(
  monitorId: string,
  score: number,
  grade: string
) {
  return prisma.monitor.update({
    where: { id: monitorId },
    data: {
      lastRunAt: new Date(),
      lastScore: score,
      lastGrade: grade,
    },
  });
}

/** Mark a run attempt without changing score (used when a run fails). */
export async function touchMonitorRun(monitorId: string) {
  return prisma.monitor.update({ where: { id: monitorId }, data: { lastRunAt: new Date() } });
}

export async function updateMonitorSettings(
  monitorId: string,
  userId: string,
  data: {
    schedule?: MonitorSchedule;
    alertEmail?: string | null;
    slackWebhook?: string | null;
    alertOnScoreDrop?: number;
    active?: boolean;
  }
) {
  return prisma.monitor.updateMany({
    where: { id: monitorId, userId },
    data,
  });
}

export async function deleteMonitor(monitorId: string, userId: string) {
  return prisma.monitor.deleteMany({
    where: { id: monitorId, userId },
  });
}

// ─── History ──────────────────────────────────────────────────────────────────

export async function addMonitorHistory(data: {
  monitorId: string;
  score: number;
  grade: string;
  alertSent?: boolean;
}) {
  return prisma.monitorHistory.create({
    data: {
      monitorId: data.monitorId,
      score:     data.score,
      grade:     data.grade,
      alertSent: data.alertSent ?? false,
    },
  });
}

export async function getMonitorHistory(monitorId: string, limit = 90) {
  return prisma.monitorHistory.findMany({
    where: { monitorId },
    orderBy: { runAt: 'desc' },
    take: limit,
  });
}
