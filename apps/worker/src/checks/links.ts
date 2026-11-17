/**
 * FrostFlow — Link Checker
 * Finds all <a href> on a page and verifies they do not return 4xx/5xx errors.
 */

import type { Page } from 'playwright';
import type { Issue, LinkCheckResult } from '@frostflow/types';
import { assertPublicUrl } from '../security/url';

const MAX_LINKS_PER_PAGE = 60;
const CONCURRENCY = 6;
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 FrostFlowBot/1.0';

// Statuses that mean "the server is alive but refuses bots" — not a broken link
const BOT_BLOCKED = new Set([401, 403, 405, 429, 999]);

async function probe(url: string): Promise<number> {
  const opts = (method: string): RequestInit => ({
    method,
    redirect: 'follow',
    headers: { 'User-Agent': UA, Accept: '*/*' },
    signal: AbortSignal.timeout(8000),
  });
  try {
    await assertPublicUrl(url);
    let res = await fetch(url, opts('HEAD'));
    // Many servers mishandle HEAD → retry with GET before declaring the link broken
    if (res.status >= 400) {
      res = await fetch(url, opts('GET'));
      await res.body?.cancel().catch(() => undefined);
    }
    return res.status;
  } catch {
    return 0;
  }
}

export async function checkLinks(
  page: Page,
  pageUrl: string,
  seen: Set<string> = new Set()
): Promise<{ result: LinkCheckResult; issues: Issue[] }> {
  const issues: Issue[] = [];
  const broken: LinkCheckResult['broken'] = [];
  let workingCount = 0;

  const hrefs = await page.evaluate(() =>
    Array.from(document.querySelectorAll('a[href]')).map((a) => a.getAttribute('href') ?? '')
  );

  const urls: string[] = [];
  for (const href of hrefs) {
    if (!href || /^(javascript:|mailto:|tel:|sms:|data:|#)/i.test(href)) continue;
    try {
      const u = new URL(href, pageUrl);
      if (u.protocol !== 'http:' && u.protocol !== 'https:') continue;
      u.hash = '';
      const abs = u.href;
      if (!seen.has(abs)) {
        seen.add(abs);
        urls.push(abs);
      }
    } catch {
      /* malformed href — ignore */
    }
  }

  const toCheck = urls.slice(0, MAX_LINKS_PER_PAGE);
  for (let i = 0; i < toCheck.length; i += CONCURRENCY) {
    await Promise.all(
      toCheck.slice(i, i + CONCURRENCY).map(async (url) => {
        const status = await probe(url);
        if (status === 0 || (status >= 400 && !BOT_BLOCKED.has(status))) {
          broken.push({ url, statusCode: status, foundOn: pageUrl });
        } else {
          workingCount++;
        }
      })
    );
  }

  for (const b of broken) {
    let title = 'Broken link found';
    let detail = `Returns status code ${b.statusCode}`;
    let business =
      'Visitors clicking this link will see an error page, which damages trust and hurts SEO rankings.';

    if (b.statusCode === 404 || b.statusCode === 410) {
      title = 'Dead link (page not found)';
      business = "This link points to a page that doesn't exist anymore. Users hit a dead end.";
    } else if (b.statusCode === 0) {
      title = 'Unreachable link (timeout / DNS)';
      detail = 'Connection timed out or failed to resolve.';
      business = "This link points to a site that is down or doesn't exist, making your site look unmaintained.";
    } else if (b.statusCode >= 500) {
      title = `Server error on linked page (${b.statusCode})`;
      business = 'The page this links to is currently broken, frustrating users who click it.';
    }

    issues.push({
      category: 'links',
      severity: 'high',
      title,
      businessImpact: business,
      technicalDetail: `Link to ${b.url} failed: ${detail}. Found on ${b.foundOn}.`,
      location: b.url,
      fix: `1. Open your CMS/editor.\n2. Find the link pointing to ${b.url}.\n3. Update it to a working URL, or remove it.`,
      effort: 'low',
    });
  }

  return { result: { broken, working: workingCount, total: toCheck.length }, issues };
}
