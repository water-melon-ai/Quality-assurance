/**
 * FrostFlow — Database Query Functions: Results + Issues
 * Stores the output of a completed check job
 */

import { Prisma } from '@prisma/client';
import { prisma } from '../client';
import type {
  CheckResults,
  GeminiReport,
  Issue as IssueType,
  Score,
} from '@frostflow/types';


// ─── Create Result ────────────────────────────────────────────────────────────

export async function createResult(data: {
  jobId: string;
  score: Score;
  issues: IssueType[];
  rawData: CheckResults;
  geminiReport?: GeminiReport | null;
  desktopScreenshotUrl?: string | null;
  mobileScreenshotUrl?: string | null;
  cached?: boolean;
}) {
  const { score, issues, rawData, geminiReport } = data;

  // Count issues by severity
  const criticalCount = issues.filter((i) => i.severity === 'critical').length;
  const highCount     = issues.filter((i) => i.severity === 'high').length;
  const mediumCount   = issues.filter((i) => i.severity === 'medium').length;
  const lowCount      = issues.filter((i) => i.severity === 'low').length;

  // Count how many checks passed (categories with no issues)
  const categories = ['performance', 'security', 'accessibility', 'seo', 'links', 'mobile'];
  const passedChecks = categories.filter(
    (cat) => !issues.some((i) => i.category === cat && (i.severity === 'critical' || i.severity === 'high'))
  ).length;

  // Extract perf metrics for quick access
  const perf = rawData.performance;

  return prisma.result.create({
    data: {
      jobId:         data.jobId,
      score:         score.total,
      grade:         score.grade,
      scoreBreakdown: score.breakdown as unknown as Prisma.InputJsonValue,
      criticalCount,
      highCount,
      mediumCount,
      lowCount,
      passedChecks,
      loadTimeMs:   perf?.loadTime ?? null,
      pageSizeBytes: perf?.pageSize ?? null,
      fcpMs:        perf?.fcp ?? null,
      lcpMs:        perf?.lcp ?? null,
      rawData:      JSON.parse(JSON.stringify(rawData)) as Prisma.InputJsonValue,
      geminiReport: geminiReport ? (geminiReport as unknown as Prisma.InputJsonValue) : Prisma.JsonNull,
      desktopScreenshotUrl: data.desktopScreenshotUrl ?? null,
      mobileScreenshotUrl:  data.mobileScreenshotUrl  ?? null,
      cached:       data.cached ?? false,
      // Create all issues in a single nested write
      issues: {
        create: issues.map((issue) => ({
          severity:       issue.severity,
          category:       issue.category,
          title:          issue.title,
          businessImpact: issue.businessImpact,
          technicalDetail: issue.technicalDetail,
          location:       issue.location ?? null,
          fix:            issue.fix,
          effort:         issue.effort,
        })),
      },
    },
    include: {
      issues: true,
    },
  });
}

// ─── Find Result ──────────────────────────────────────────────────────────────

export async function getResultById(resultId: string) {
  return prisma.result.findUnique({
    where: { id: resultId },
    include: {
      issues: {
        orderBy: [
          { severity: 'asc' }, // critical first (enum order)
          { category: 'asc' },
        ],
      },
      job: {
        select: { url: true, createdAt: true, tier: true, userId: true },
      },
      reports: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { id: true, pdfUrl: true, shareToken: true, whiteLabelAgencyName: true, whiteLabelLogoUrl: true },
      },
    },
  });
}

export async function getResultByJobId(jobId: string) {
  return prisma.result.findUnique({
    where: { jobId },
    include: {
      issues: {
        orderBy: { severity: 'asc' },
      },
    },
  });
}

// ─── Find Issues by Category ──────────────────────────────────────────────────

export async function getIssuesByCategory(
  resultId: string,
  category?: string
) {
  return prisma.issue.findMany({
    where: {
      resultId,
      ...(category ? { category: category as Prisma.IssueWhereInput['category'] } : {}),
    },
    orderBy: { severity: 'asc' },
  });
}

// ─── Score History (for trend charts) ────────────────────────────────────────

export async function getScoreHistoryForUrl(
  userId: string,
  url: string,
  limit = 30
) {
  return prisma.result.findMany({
    where: {
      job: { userId, url },
    },
    select: {
      score: true,
      grade: true,
      createdAt: true,
      criticalCount: true,
      highCount: true,
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

// ─── Update Result (add AI report after generation) ───────────────────────────

export async function updateResultGeminiReport(
  resultId: string,
  geminiReport: GeminiReport
) {
  return prisma.result.update({
    where: { id: resultId },
    data: { geminiReport: geminiReport as unknown as Prisma.InputJsonValue },
  });
}

export async function updateResultScreenshots(
  resultId: string,
  data: {
    desktopScreenshotUrl?: string | null;
    mobileScreenshotUrl?: string | null;
  }
) {
  return prisma.result.update({
    where: { id: resultId },
    data,
  });
}
