/**
 * FrostFlow — Performance Checker
 * Measures Core Web Vitals (FCP, LCP, CLS), load time, page size, and requests.
 */

import type { Page } from 'playwright';
import type { Issue, PerformanceCheckResult } from '@frostflow/types';

export async function checkPerformance(
  page: Page
): Promise<{ result: PerformanceCheckResult; issues: Issue[] }> {
  const issues: Issue[] = [];

  // Get total page size and request count by injecting a script to read the performance entries
  const resourceMetrics = await page.evaluate(() => {
    let totalSize = 0;
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    
    for (const res of resources) {
      // transferSize is 0 if served from cache, encodedBodySize is the uncompressed size.
      // We'll use transferSize if available, otherwise encodedBodySize.
      const size = res.transferSize > 0 ? res.transferSize : res.encodedBodySize || 0; // 0 for opaque cross-origin → undercount
      totalSize += size;
    }
    
    // Add the main document size
    const navs = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    if (navs.length > 0) {
      const nav = navs[0];
      const navSize = (nav && nav.transferSize > 0) ? nav.transferSize : nav?.encodedBodySize || 0;
      totalSize += navSize;
    }

    return {
      pageSize: totalSize,
      requestCount: resources.length + (navs.length > 0 ? 1 : 0),
    };
  });

  // Core Web Vitals: LCP/CLS are not in the performance timeline buffer, so use buffered observers.
  const webVitals = await page.evaluate(
    () =>
      new Promise<{ fcp: number; lcp: number; cls: number; loadTime: number }>((resolve) => {
        let lcp = 0;
        let cls = 0;

        const observe = (type: string, cb: (entries: PerformanceEntryList) => void) => {
          try {
            new PerformanceObserver((list) => cb(list.getEntries())).observe({ type, buffered: true });
          } catch {
            /* entry type unsupported */
          }
        };
        observe('largest-contentful-paint', (entries) => {
          const last = entries[entries.length - 1];
          if (last) lcp = last.startTime;
        });
        observe('layout-shift', (entries) => {
          for (const e of entries as unknown as Array<{ hadRecentInput: boolean; value: number }>) {
            if (!e.hadRecentInput) cls += e.value;
          }
        });

        // Give the observers a moment to flush their buffered entries
        setTimeout(() => {
          const fcpEntry = performance.getEntriesByType('paint').find((e) => e.name === 'first-contentful-paint');
          const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
          const loadTime = nav && nav.loadEventEnd > 0 ? nav.loadEventEnd : nav?.domContentLoadedEventEnd ?? 0;
          resolve({ fcp: fcpEntry?.startTime ?? 0, lcp, cls, loadTime });
        }, 600);
      })
  );

  const result: PerformanceCheckResult = {
    fcp: Math.round(webVitals.fcp),
    lcp: Math.round(webVitals.lcp),
    cls: Number(webVitals.cls.toFixed(3)),
    loadTime: Math.round(webVitals.loadTime),
    pageSize: resourceMetrics.pageSize,
    requestCount: resourceMetrics.requestCount,
    issues: [], // We'll populate this below
  };

  // Flag if load time over 3 seconds (3000ms)
  if (result.loadTime > 3000) {
    issues.push({
      category: 'performance',
      severity: 'high',
      title: 'Page loads too slowly',
      businessImpact: 'Visitors hate waiting. A slow site causes people to leave before seeing your content, directly losing you leads and sales.',
      technicalDetail: `Load time is ${(result.loadTime / 1000).toFixed(1)}s (Threshold: 3.0s).`,
      fix: '1. Compress large images.\n2. Minify CSS/JS.\n3. Consider a caching plugin or CDN (like Cloudflare).',
      effort: 'medium',
    });
  }

  // Flag if page size over 3MB (3 * 1024 * 1024 bytes)
  const MAX_SIZE = 3 * 1024 * 1024;
  if (result.pageSize > MAX_SIZE) {
    issues.push({
      category: 'performance',
      severity: 'medium',
      title: 'Page size is heavily bloated',
      businessImpact: 'A heavy page drains mobile data and loads slowly on weak connections, alienating mobile users.',
      technicalDetail: `Page size is ${(result.pageSize / (1024 * 1024)).toFixed(2)}MB (Threshold: 3.0MB). Requests: ${result.requestCount}.`,
      fix: '1. Resize images to maximum display width before uploading.\n2. Convert images to WebP format.\n3. Remove unused third-party scripts.',
      effort: 'medium',
    });
  }

  // Flag high CLS (Layout Shift)
  if (result.cls > 0.25) {
    issues.push({
      category: 'performance',
      severity: 'medium',
      title: 'Content jumps around while loading',
      businessImpact: 'When the page shifts as it loads, users accidentally click the wrong buttons. It feels broken and unprofessional.',
      technicalDetail: `Cumulative Layout Shift is ${result.cls} (Poor is > 0.25).`,
      fix: '1. Set explicit width and height attributes on all images.\n2. Pre-allocate space for ads or dynamic content.',
      effort: 'medium',
    });
  }

  result.issues = issues;

  return {
    result,
    issues,
  };
}
