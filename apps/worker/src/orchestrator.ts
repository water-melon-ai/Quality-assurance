/**
 * FrostFlow — Scan Orchestrator
 * Drives Playwright through a site, runs every check, scores, writes the AI report + PDF and persists the result.
 */

import { chromium, type Browser, type BrowserContext, type Page, type Response } from 'playwright';
import * as database from '@frostflow/database';
import type { CheckResults, Issue, TestJobPayload, LinkCheckResult } from '@frostflow/types';
import { checkPerformance } from './checks/performance';
import { checkSecurity } from './checks/security';
import { checkAccessibility } from './checks/accessibility';
import { checkSeo } from './checks/seo';
import { checkLinks } from './checks/links';
import { checkMobile } from './checks/mobile';
import { calculateScore } from './reporter/scorer';
import { generateAiReport } from './reporter/gemini';
import { generateAndUploadPdf } from './reporter/pdf';
import { uploadBuffer } from './storage';
import { assertPublicUrl, isBlockedHostnameSync } from './security/url';

const NAV_TIMEOUT = 30_000;
const SCAN_TIMEOUT = 4 * 60_000;

// ─── Shared browser ───────────────────────────────────────────────────────────

let browserPromise: Promise<Browser> | null = null;

function getBrowser(): Promise<Browser> {
  if (!browserPromise) {
    browserPromise = chromium
      .launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] })
      .then((b) => {
        b.on('disconnected', () => {
          browserPromise = null;
        });
        return b;
      });
    browserPromise.catch(() => {
      browserPromise = null;
    });
  }
  return browserPromise;
}

export async function closeBrowser() {
  if (!browserPromise) return;
  const b = await browserPromise.catch(() => null);
  browserPromise = null;
  await b?.close().catch(() => undefined);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function newContext(browser: Browser, mobile: boolean): Promise<BrowserContext> {
  const context = await browser.newContext(
    mobile
      ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' }
      : { viewport: { width: 1366, height: 768 } }
  );
  // Never let a scanned page make the browser talk to private networks
  await context.route('**/*', (route) => {
    try {
      return isBlockedHostnameSync(new URL(route.request().url()).hostname) ? route.abort() : route.continue();
    } catch {
      return route.continue();
    }
  });
  return context;
}

async function load(page: Page, url: string): Promise<Response | null> {
  const response = await page.goto(url, { waitUntil: 'load', timeout: NAV_TIMEOUT });
  await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => undefined);
  return response;
}

async function sameOriginLinks(page: Page, origin: string): Promise<string[]> {
  const hrefs = await page.evaluate(() => Array.from(document.querySelectorAll('a[href]')).map((a) => (a as HTMLAnchorElement).href));
  const out = new Set<string>();
  for (const href of hrefs) {
    try {
      const u = new URL(href);
      u.hash = '';
      if (u.origin === origin && !/\.(pdf|zip|png|jpe?g|gif|svg|webp|mp4|mp3|css|js|xml)$/i.test(u.pathname)) out.add(u.href);
    } catch { /* ignore */ }
  }
  return [...out];
}

function dedupe(issues: Issue[]): Issue[] {
  const seen = new Set<string>();
  return issues.filter((i) => {
    const key = `${i.category}|${i.title}|${i.location ?? ''}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

const sortBySeverity = (a: Issue, b: Issue) =>
  ['critical', 'high', 'medium', 'low'].indexOf(a.severity) - ['critical', 'high', 'medium', 'low'].indexOf(b.severity);

// ─── Orchestrator ─────────────────────────────────────────────────────────────

export interface ScanOutcome {
  resultId: string;
  score: number;
  grade: string;
}

export async function runScan(payload: TestJobPayload): Promise<ScanOutcome> {
  const { jobId, tier, userId } = payload;
  const deadline = Date.now() + SCAN_TIMEOUT;
  const startUrl = await assertPublicUrl(payload.url);
  const isPaid = true; // All features are completely free

  await database.jobs.updateJobStatus(jobId, 'crawling', 5);

  const browser = await getBrowser();
  const desktop = await newContext(browser, false);
  const mobile = await newContext(browser, true);

  try {
    const desktopPage = await desktop.newPage();
    const mobilePage = await mobile.newPage();

    const issues: Issue[] = [];
    const linkTotals: LinkCheckResult = { broken: [], working: 0, total: 0 };
    const seenLinks = new Set<string>();
    const visited = new Set<string>();
    const queue: string[] = [startUrl.href];
    const maxPages = Math.max(1, payload.maxPages);
    let first: Partial<CheckResults> = {};
    let desktopShot: Buffer | null = null;
    let mobileShot: Buffer | null = null;

    while (queue.length > 0 && visited.size < maxPages && Date.now() < deadline) {
      const pageUrl = queue.shift()!;
      if (visited.has(pageUrl)) continue;
      visited.add(pageUrl);
      const isFirst = visited.size === 1;

      let response: Response | null;
      try {
        await assertPublicUrl(pageUrl);
        response = await load(desktopPage, pageUrl);
      } catch (err) {
        if (isFirst) {
          throw new Error(`Could not open ${pageUrl}: ${err instanceof Error ? err.message : String(err)}`);
        }
        continue; // an unreachable inner page shouldn't fail the whole scan
      }

      // Guard against redirects to a private host
      await assertPublicUrl(desktopPage.url());

      await database.jobs.updateJobStatus(
        jobId,
        'checking',
        Math.min(70, 10 + Math.round((visited.size / maxPages) * 60))
      );

      const [perf, a11y, seo] = [
        await checkPerformance(desktopPage),
        await checkAccessibility(desktopPage),
        await checkSeo(desktopPage),
      ];
      const links = await checkLinks(desktopPage, desktopPage.url(), seenLinks);

      let sec: Awaited<ReturnType<typeof checkSecurity>> | null = null;
      if (isFirst) sec = await checkSecurity(desktopPage, desktopPage.url(), response);

      let mob: Awaited<ReturnType<typeof checkMobile>> | null = null;
      try {
        await load(mobilePage, pageUrl);
        mob = await checkMobile(mobilePage);
        if (isFirst) mobileShot = await mobilePage.screenshot({ type: 'jpeg', quality: 70 }).catch(() => null);
      } catch { /* mobile pass is best-effort for inner pages */ }
      if (isFirst) desktopShot = await desktopPage.screenshot({ type: 'jpeg', quality: 70 }).catch(() => null);

      const pageIssues = [
        ...perf.issues, ...a11y.issues, ...seo.issues, ...links.issues,
        ...(sec?.issues ?? []), ...(mob?.issues ?? []),
      ].map((i) => ({ ...i, location: i.location ?? pageUrl }));
      issues.push(...pageIssues);

      linkTotals.broken.push(...links.result.broken);
      linkTotals.working += links.result.working;
      linkTotals.total += links.result.total;

      if (isFirst) {
        first = { performance: perf.result, accessibility: a11y.result, seo: seo.result, security: sec?.result ?? null, mobile: mob?.result ?? null };
      }
      await database.jobs.updateJobProgress(jobId, Math.min(70, 10 + Math.round((visited.size / maxPages) * 60)), visited.size);

      if (visited.size < maxPages) {
        for (const l of await sameOriginLinks(desktopPage, startUrl.origin)) {
          if (!visited.has(l) && !queue.includes(l)) queue.push(l);
        }
      }
    }

    // ── Screenshots ──
    const stamp = `${jobId}-${Date.now()}`;
    const [desktopShotUrl, mobileShotUrl] = await Promise.all([
      desktopShot ? uploadBuffer(desktopShot, `desktop-${stamp}.jpg`, 'image/jpeg') : null,
      mobileShot ? uploadBuffer(mobileShot, `mobile-${stamp}.jpg`, 'image/jpeg') : null,
    ]);
    if (first.mobile) first.mobile.screenshotUrl = mobileShotUrl;

    const rawData: CheckResults = {
      links: linkTotals,
      performance: first.performance ?? null,
      accessibility: first.accessibility ?? null,
      security: first.security ?? null,
      seo: first.seo ?? null,
      mobile: first.mobile ?? null,
    };

    // ── Score ──
    await database.jobs.updateJobStatus(jobId, 'scoring', 75);
    const finalIssues = dedupe(issues).sort(sortBySeverity);
    const score = calculateScore(finalIssues);

    // ── AI report + PDF (paid tiers) ──
    let ai = null;
    let pdfUrl: string | null = null;
    const user = userId ? await database.users.getUserById(userId) : null;
    if (isPaid) {
      await database.jobs.updateJobStatus(jobId, 'generating_report', 85);
      ai = await generateAiReport(startUrl.href, score, finalIssues);
      if (ai && userId) await database.usage.incrementAiReportsGenerated(userId).catch(() => undefined);
      pdfUrl = await generateAndUploadPdf(startUrl.href, score, finalIssues, ai, {
        agencyName: user?.agencyName ?? null,
        logoUrl: user?.logoUrl ?? null,
      });
    }

    // ── Persist ──
    const result = await database.results.createResult({
      jobId, score, issues: finalIssues, rawData, geminiReport: ai,
      desktopScreenshotUrl: desktopShotUrl, mobileScreenshotUrl: mobileShotUrl,
    });
    if (isPaid && pdfUrl) {
      const report = await database.reports.createReport({
        resultId: result.id, userId: userId ?? null,
        whiteLabelAgencyName: user?.agencyName ?? null, whiteLabelLogoUrl: user?.logoUrl ?? null,
      });
      await database.reports.updateReportPdfUrl(report.id, pdfUrl);
    }
    if (userId) await database.usage.incrementPagesCrawled(userId, visited.size).catch(() => undefined);

    await database.jobs.updateJobProgress(jobId, 100, visited.size);
    await database.jobs.updateJobStatus(jobId, 'done', 100);

    return { resultId: result.id, score: score.total, grade: score.grade };
  } finally {
    await Promise.allSettled([desktop.close(), mobile.close()]);
  }
}
