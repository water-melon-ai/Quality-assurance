/**
 * FrostFlow — Security Checker
 * Checks SSL, security headers, mixed content, and exposed sensitive files.
 */

import type { Page, Response } from 'playwright';
import type { Issue, SecurityCheckResult } from '@frostflow/types';
import tls from 'tls';

export async function checkSecurity(
  page: Page,
  pageUrl: string,
  initialResponse: Response | null
): Promise<{ result: SecurityCheckResult; issues: Issue[] }> {
  const issues: Issue[] = [];
  const urlObj = new URL(pageUrl);

  const result: SecurityCheckResult = {
    sslValid: false,
    sslExpiresAt: null,
    sslDaysRemaining: null,
    headers: {
      csp: false,
      xFrameOptions: false,
      xContentTypeOptions: false,
      hsts: false,
    },
    mixedContent: false,
    exposedFiles: [],
    issues: [],
  };

  // 1. Check SSL Certificate
  if (urlObj.protocol === 'https:') {
    try {
      const port = urlObj.port ? Number(urlObj.port) : 443;
      const certInfo = await new Promise<{ valid: boolean; validTo: Date }>((resolve, reject) => {
        const socket = tls.connect({ host: urlObj.hostname, port, servername: urlObj.hostname, timeout: 8000 }, () => {
          const cert = socket.getPeerCertificate();
          const authorized = socket.authorized;
          const err = socket.authorizationError;
          socket.end();
          if (authorized) resolve({ valid: true, validTo: new Date(cert.valid_to) });
          else reject(new Error(String(err ?? 'Unauthorized')));
        });
        socket.on('timeout', () => {
          socket.destroy();
          reject(new Error('TLS timeout'));
        });
        socket.on('error', reject);
      });

      result.sslValid = certInfo.valid;
      result.sslExpiresAt = certInfo.validTo;
      result.sslDaysRemaining = Math.floor((certInfo.validTo.getTime() - Date.now()) / 86_400_000);
    } catch {
      result.sslValid = false;
    }
  }

  // 2. Check Security Headers
  if (initialResponse) {
    const headers = initialResponse.headers();
    
    // Content-Security-Policy
    result.headers.csp = !!headers['content-security-policy'];
    
    // X-Frame-Options
    result.headers.xFrameOptions = !!headers['x-frame-options'];
    
    // X-Content-Type-Options
    result.headers.xContentTypeOptions = !!headers['x-content-type-options'];
    
    // Strict-Transport-Security (HSTS)
    result.headers.hsts = !!headers['strict-transport-security'];
  }

  // 3. Check for mixed content (HTTP resources loaded on HTTPS page)
  if (urlObj.protocol === 'https:') {
    const mixedContentFound = await page.evaluate(() => {
      return performance.getEntriesByType('resource').some((r) => r.name.startsWith('http://'));
    });
    result.mixedContent = mixedContentFound;
  }

  // 4. Exposed sensitive files — verify the body actually looks like the file (avoids SPA catch-all false positives)
  const sensitive: Array<{ path: string; looksReal: (body: string) => boolean }> = [
    { path: '/.env', looksReal: (b) => /^[A-Z][A-Z0-9_]*\s*=/m.test(b) },
    { path: '/.git/config', looksReal: (b) => b.includes('[core]') },
    { path: '/wp-config.php.bak', looksReal: (b) => b.includes('DB_PASSWORD') || b.includes('DB_NAME') },
  ];
  for (const { path, looksReal } of sensitive) {
    try {
      const res = await fetch(new URL(path, urlObj.origin).href, {
        redirect: 'manual',
        signal: AbortSignal.timeout(4000),
      });
      if (res.status === 200 && !(res.headers.get('content-type') ?? '').includes('text/html')) {
        const body = (await res.text()).slice(0, 4000);
        if (looksReal(body)) result.exposedFiles.push(path);
      } else {
        await res.body?.cancel().catch(() => undefined);
      }
    } catch {
      /* network error → treat as not exposed */
    }
  }

  // ─── Generate Issues ────────────────────────────────────────────────────────

  if (!result.sslValid && urlObj.protocol === 'https:') {
    issues.push({
      category: 'security',
      severity: 'critical',
      title: 'Invalid SSL Certificate',
      businessImpact: 'Browsers will show a terrifying "Not Secure" warning to visitors before they even see your site, killing trust immediately.',
      technicalDetail: 'SSL certificate is invalid, expired, or self-signed.',
      fix: 'Renew or reconfigure the SSL certificate with your hosting provider.',
      effort: 'medium',
    });
  } else if (result.sslDaysRemaining !== null && result.sslDaysRemaining < 30) {
    issues.push({
      category: 'security',
      severity: 'high',
      title: 'SSL Certificate Expiring Soon',
      businessImpact: 'Your site will break and show a security warning to all visitors in less than 30 days if this is not fixed.',
      technicalDetail: `Certificate expires in ${result.sslDaysRemaining} days.`,
      fix: 'Ensure auto-renewal is enabled for your SSL certificate.',
      effort: 'low',
    });
  }

  if (!result.headers.csp) {
    issues.push({
      category: 'security',
      severity: 'medium',
      title: 'Key security setting missing (CSP)',
      businessImpact: 'Your site is more vulnerable to hackers trying to inject malicious code or steal visitor data.',
      technicalDetail: 'Content-Security-Policy header is missing.',
      fix: 'Configure your server or framework to send a Content-Security-Policy header.',
      effort: 'high',
    });
  }

  if (!result.headers.xFrameOptions) {
    issues.push({
      category: 'security',
      severity: 'low',
      title: 'Clickjacking protection missing',
      businessImpact: 'Malicious sites could invisibly embed your website to trick users into clicking buttons they didn\'t intend to.',
      technicalDetail: 'X-Frame-Options header is missing.',
      fix: 'Add the X-Frame-Options: DENY or SAMEORIGIN header.',
      effort: 'low',
    });
  }

  if (result.mixedContent) {
    issues.push({
      category: 'security',
      severity: 'high',
      title: 'Insecure content on a secure page',
      businessImpact: 'Even though your site has an SSL certificate, some images or scripts are loading insecurely, causing browsers to remove the "secure lock" icon.',
      technicalDetail: 'Mixed content found (HTTP resources loaded on an HTTPS page).',
      fix: 'Update all resource links (images, scripts, styles) to use "https://" instead of "http://".',
      effort: 'medium',
    });
  }

  if (result.exposedFiles.length > 0) {
    issues.push({
      category: 'security',
      severity: 'critical',
      title: 'Sensitive configuration files exposed',
      businessImpact: 'Hackers can easily download your private server passwords and gain total control of your website and database.',
      technicalDetail: `Exposed files found: ${result.exposedFiles.join(', ')}`,
      fix: 'Immediately configure your web server to block public access to hidden files (starting with a dot) and backup files.',
      effort: 'low',
    });
  }

  result.issues = issues;

  return { result, issues };
}
