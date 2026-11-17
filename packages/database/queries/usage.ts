/**
 * FrostFlow — Database Query Functions: Usage Tracking
 * Daily usage counters for rate limiting and billing insights
 */

import { prisma } from '../client';


function todayDate(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

// ─── Increment ────────────────────────────────────────────────────────────────

export async function incrementTestsRun(userId: string) {
  return prisma.usage.upsert({
    where: { userId_date: { userId, date: todayDate() } },
    update: { testsRun: { increment: 1 } },
    create: {
      userId,
      date:     todayDate(),
      testsRun: 1,
    },
  });
}

export async function incrementPagesCrawled(userId: string, count: number) {
  return prisma.usage.upsert({
    where: { userId_date: { userId, date: todayDate() } },
    update: { pagesCrawled: { increment: count } },
    create: {
      userId,
      date:         todayDate(),
      pagesCrawled: count,
    },
  });
}

export async function incrementAiReportsGenerated(userId: string) {
  return prisma.usage.upsert({
    where: { userId_date: { userId, date: todayDate() } },
    update: { aiReportsGenerated: { increment: 1 } },
    create: {
      userId,
      date:               todayDate(),
      aiReportsGenerated: 1,
    },
  });
}

// ─── Query ────────────────────────────────────────────────────────────────────

export async function getTodayUsage(userId: string) {
  return prisma.usage.findUnique({
    where: { userId_date: { userId, date: todayDate() } },
  });
}

export async function getUsageHistory(userId: string, days = 30) {
  const from = new Date();
  from.setDate(from.getDate() - days);

  return prisma.usage.findMany({
    where: {
      userId,
      date: { gte: from },
    },
    orderBy: { date: 'asc' },
  });
}

// ─── IP Rate Limiting (anonymous free tier) ────────────────────────────────────

export async function getIpTestCount(ip: string): Promise<number> {
  const record = await prisma.ipRateLimit.findUnique({ where: { ip } });
  if (!record || record.date.getTime() !== todayDate().getTime()) return 0;
  return record.testsToday;
}

export async function incrementIpTestCount(ip: string): Promise<number> {
  const today = todayDate();

  // Same-day row: atomic increment
  const updated = await prisma.ipRateLimit.updateMany({
    where: { ip, date: today },
    data: { testsToday: { increment: 1 } },
  });

  if (updated.count === 0) {
    // New day (or first visit): reset the counter
    await prisma.ipRateLimit.upsert({
      where: { ip },
      update: { testsToday: 1, date: today },
      create: { ip, testsToday: 1, date: today },
    });
    return 1;
  }

  return getIpTestCount(ip);
}
