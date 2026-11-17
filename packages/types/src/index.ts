/**
 * FrostFlow — Shared Type Definitions
 * Used by both apps/web and apps/worker
 */

// ─── Tier ─────────────────────────────────────────────────────────────────────

export type Tier = 'free' | 'studio' | 'agency';

// ─── Job ──────────────────────────────────────────────────────────────────────

export type JobStatus =
  | 'queued'
  | 'crawling'
  | 'checking'
  | 'scoring'
  | 'generating_report'
  | 'done'
  | 'failed';

export interface Job {
  id: string;
  userId: string | null;
  url: string;
  status: JobStatus;
  tier: Tier;
  pagesCrawled: number;
  progress: number; // 0–100
  createdAt: Date;
  completedAt: Date | null;
  error: string | null;
}

export interface JobProgressUpdate {
  jobId: string;
  status: JobStatus;
  progress: number;
  step: string;
  log?: LogLine;
}

// ─── Log Stream ───────────────────────────────────────────────────────────────

export type LogLevel = 'ok' | 'warn' | 'error' | 'info';

export interface LogLine {
  level: LogLevel;
  message: string;
  timestamp: number; // epoch ms
}

// ─── Checks ───────────────────────────────────────────────────────────────────

export type CheckCategory =
  | 'performance'
  | 'security'
  | 'accessibility'
  | 'seo'
  | 'links'
  | 'mobile';

export type Severity = 'critical' | 'high' | 'medium' | 'low';

export interface Issue {
  id?: string;
  category: CheckCategory;
  severity: Severity;
  title: string;
  businessImpact: string;  // Plain English for non-technical users
  technicalDetail: string; // Raw technical info
  location?: string;       // URL, selector, or file path
  fix: string;             // Step-by-step fix instructions
  effort: 'low' | 'medium' | 'high';
}

// ─── Check Results ────────────────────────────────────────────────────────────

export interface LinkCheckResult {
  broken: Array<{ url: string; statusCode: number; foundOn: string }>;
  working: number;
  total: number;
}

export interface PerformanceCheckResult {
  fcp: number;    // ms
  lcp: number;    // ms
  cls: number;    // score
  loadTime: number; // ms
  pageSize: number; // bytes
  requestCount: number;
  issues: Issue[];
}

export interface AccessibilityCheckResult {
  imagesWithoutAlt: number;
  missingLabels: number;
  h1Count: number;
  headingHierarchyValid: boolean;
  issues: Issue[];
}

export interface SecurityCheckResult {
  sslValid: boolean;
  sslExpiresAt: Date | null;
  sslDaysRemaining: number | null;
  headers: {
    csp: boolean;
    xFrameOptions: boolean;
    xContentTypeOptions: boolean;
    hsts: boolean;
  };
  mixedContent: boolean;
  exposedFiles: string[];
  issues: Issue[];
}

export interface SeoCheckResult {
  title: string | null;
  titleLength: number;
  metaDescription: string | null;
  metaDescriptionLength: number;
  hasOgTitle: boolean;
  hasOgImage: boolean;
  hasOgDescription: boolean;
  hasCanonical: boolean;
  issues: Issue[];
}

export interface MobileCheckResult {
  hasViewportMeta: boolean;
  hasHorizontalScroll: boolean;
  smallTapTargets: number;
  smallTextElements: number;
  screenshotUrl: string | null;
  issues: Issue[];
}

export interface CheckResults {
  links: LinkCheckResult | null;
  performance: PerformanceCheckResult | null;
  accessibility: AccessibilityCheckResult | null;
  security: SecurityCheckResult | null;
  seo: SeoCheckResult | null;
  mobile: MobileCheckResult | null;
}

// ─── Score / Report ───────────────────────────────────────────────────────────

export type Grade = 'A' | 'B' | 'C' | 'D' | 'F';

export interface Score {
  total: number;       // 0–100
  grade: Grade;
  breakdown: {
    performance: number;
    security: number;
    accessibility: number;
    seo: number;
    links: number;
    mobile: number;
  };
}

export interface GeminiReport {
  executiveSummary: string;
  whatIsWorkingWell: string;
  criticalIssues: string | null;
  fixThisWeek: string;
  lowerPriorityItems: string;
  overallAssessment: string;
}

export interface Result {
  id: string;
  jobId: string;
  score: Score;
  issues: Issue[];
  rawData: CheckResults;
  geminiReport: GeminiReport | null;
  desktopScreenshotUrl: string | null;
  mobileScreenshotUrl: string | null;
  cached: boolean;
  createdAt: Date;
}

// ─── Report / Share ───────────────────────────────────────────────────────────

export interface Report {
  id: string;
  resultId: string;
  pdfUrl: string | null;
  shareToken: string;
  expiresAt: Date;
  whiteLabelAgencyName: string | null;
  whiteLabelLogoUrl: string | null;
}

// ─── Monitor ──────────────────────────────────────────────────────────────────

export type MonitorSchedule = 'every_6h' | 'every_12h' | 'every_24h';

export interface Monitor {
  id: string;
  userId: string;
  url: string;
  schedule: MonitorSchedule;
  alertOnScoreDrop: number;
  lastRunAt: Date | null;
  lastScore: number | null;
  alertEmail: string | null;
  slackWebhook: string | null;
  active: boolean;
}

// ─── User ─────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  tier: Tier;
  stripeCustomerId: string | null;
  agencyName: string | null;
  logoUrl: string | null;
  createdAt: Date;
}

// ─── API Response Types ───────────────────────────────────────────────────────

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: string;
  code: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ─── Queue Job Payloads ───────────────────────────────────────────────────────

export interface TestJobPayload {
  jobId: string;
  url: string;
  tier: Tier;
  userId: string | null;
  maxPages: number;
}

export interface MonitorJobPayload {
  monitorId: string;
  url: string;
  userId: string;
  maxPages: number;
}
