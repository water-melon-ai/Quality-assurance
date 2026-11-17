/**
 * FrostFlow — Database Query Functions: Reports
 * Shareable report links + PDF artifacts
 */

import { prisma } from '../client';
import { randomBytes } from 'crypto';


// ─── Generate Share Token ─────────────────────────────────────────────────────

function generateShareToken(): string {
  return randomBytes(16).toString('hex'); // 32 hex chars, unguessable
}

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createReport(data: {
  resultId: string;
  userId?: string | null;
  whiteLabelAgencyName?: string | null;
  whiteLabelLogoUrl?: string | null;
}) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // 30-day expiry

  return prisma.report.create({
    data: {
      resultId:            data.resultId,
      userId:              data.userId ?? null,
      shareToken:          generateShareToken(),
      expiresAt,
      whiteLabelAgencyName: data.whiteLabelAgencyName ?? null,
      whiteLabelLogoUrl:    data.whiteLabelLogoUrl ?? null,
    },
  });
}

// ─── Find ─────────────────────────────────────────────────────────────────────

export async function getReportByToken(shareToken: string) {
  return prisma.report.findUnique({
    where: { shareToken },
    include: {
      result: {
        include: {
          issues: {
            orderBy: { severity: 'asc' },
          },
          job: {
            select: { url: true, createdAt: true, tier: true },
          },
        },
      },
    },
  });
}

export async function getReportByResultId(resultId: string) {
  return prisma.report.findFirst({
    where: { resultId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getReportsByUser(userId: string) {
  return prisma.report.findMany({
    where: { userId },
    include: {
      result: {
        select: {
          score: true,
          grade: true,
          job: {
            select: { url: true, createdAt: true },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
}

// ─── Validate Token ───────────────────────────────────────────────────────────

export async function validateShareToken(shareToken: string) {
  const report = await prisma.report.findUnique({
    where: { shareToken },
    select: {
      id: true,
      expiresAt: true,
      revoked: true,
    },
  });

  if (!report) return null;
  if (report.revoked) return null;
  if (report.expiresAt < new Date()) return null;

  return report;
}

// ─── Update ───────────────────────────────────────────────────────────────────

export async function updateReportPdfUrl(reportId: string, pdfUrl: string) {
  return prisma.report.update({
    where: { id: reportId },
    data: { pdfUrl },
  });
}

export async function revokeReport(reportId: string, userId: string) {
  // Verify ownership before revoking
  return prisma.report.updateMany({
    where: { id: reportId, userId },
    data: { revoked: true },
  });
}

// ─── Cleanup (cron: delete expired reports) ───────────────────────────────────

export async function deleteExpiredReports() {
  return prisma.report.deleteMany({
    where: {
      expiresAt: { lt: new Date() },
    },
  });
}
