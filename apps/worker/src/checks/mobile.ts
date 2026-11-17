/**
 * FrostFlow — Mobile Checker
 * Evaluates mobile-friendliness: viewport, horizontal scroll, tap targets, font sizes.
 */

import type { Page } from 'playwright';
import type { Issue, MobileCheckResult } from '@frostflow/types';

export async function checkMobile(
  page: Page
): Promise<{ result: MobileCheckResult; issues: Issue[] }> {
  const issues: Issue[] = [];

  const metrics = await page.evaluate(() => {
    // 1. Check for viewport meta tag
    const viewportMeta = document.querySelector('meta[name="viewport"]')?.getAttribute('content');
    const hasViewportMeta = viewportMeta ? viewportMeta.includes('width=device-width') : false;

    // 2. Check for horizontal scrolling
    // We compare scrollWidth to clientWidth on both documentElement and body
    const docEl = document.documentElement;
    const body = document.body;
    const scrollWidth = Math.max(docEl.scrollWidth, body.scrollWidth);
    const clientWidth = Math.max(docEl.clientWidth, body.clientWidth);
    const hasHorizontalScroll = scrollWidth > clientWidth;

    // 3. Check tap targets (min 44x44px for touch usability)
    const interactiveElements = Array.from(document.querySelectorAll('a, button, input, select, textarea'));
    let smallTapTargets = 0;
    
    // We only check visible elements
    for (const el of interactiveElements) {
      const rect = el.getBoundingClientRect();
      // Ignore elements that have 0 width/height (likely hidden)
      if (rect.width > 0 && rect.height > 0) {
        if (rect.width < 44 || rect.height < 44) {
          // If it's inline text (like a link inside a paragraph), we might be more forgiving,
          // but strict mobile UI design requires 44x44 tap targets. We'll count them.
          smallTapTargets++;
        }
      }
    }

    // 4. Check text size (min 16px recommended for body copy on mobile)
    let smallTextElements = 0;
    // We sample a few text-heavy elements to avoid walking the whole DOM
    const textNodes = Array.from(document.querySelectorAll('p, li, span, a'));
    for (const el of textNodes) {
      // Very basic visibility check
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        const computedStyle = window.getComputedStyle(el);
        const fontSizeStr = computedStyle.fontSize;
        if (fontSizeStr && fontSizeStr.endsWith('px')) {
          const size = parseFloat(fontSizeStr);
          // If the text is smaller than 12px, it's definitely an issue on mobile
          if (size < 12) {
             smallTextElements++;
          }
        }
      }
    }

    return {
      hasViewportMeta,
      hasHorizontalScroll,
      smallTapTargets,
      smallTextElements,
    };
  });

  const result: MobileCheckResult = {
    hasViewportMeta: metrics.hasViewportMeta,
    hasHorizontalScroll: metrics.hasHorizontalScroll,
    smallTapTargets: metrics.smallTapTargets,
    smallTextElements: metrics.smallTextElements,
    screenshotUrl: null, // Populated later by the worker orchestrator
    issues: [],
  };

  if (!result.hasViewportMeta) {
    issues.push({
      category: 'mobile',
      severity: 'critical',
      title: 'Missing mobile viewport tag',
      businessImpact: 'Mobile devices will show a zoomed-out, tiny desktop version of your site, making it completely unusable on phones.',
      technicalDetail: '<meta name="viewport" content="width=device-width, initial-scale=1"> is missing.',
      fix: 'Add the viewport meta tag to the <head> of your document.',
      effort: 'low',
    });
  }

  if (result.hasHorizontalScroll) {
    issues.push({
      category: 'mobile',
      severity: 'high',
      title: 'Horizontal scrolling detected',
      businessImpact: 'The page content is wider than the screen. Users have to swipe left and right to read text, which feels broken and amateurish.',
      technicalDetail: 'Document scrollWidth exceeds clientWidth on mobile viewport (390x844).',
      fix: 'Check for wide images, long unbroken text strings, or fixed-width containers that exceed 100vw, and use max-width: 100%.',
      effort: 'medium',
    });
  }

  if (result.smallTapTargets > 0) {
    issues.push({
      category: 'mobile',
      severity: 'medium',
      title: 'Buttons or links are too small to tap',
      businessImpact: 'Mobile users will accidentally tap the wrong link or struggle to hit buttons, causing frustration and task abandonment.',
      technicalDetail: `${result.smallTapTargets} interactive elements are smaller than the recommended 44x44px touch target size.`,
      fix: 'Increase the padding around your links and buttons so they are at least 44px tall and wide.',
      effort: 'low',
    });
  }

  if (result.smallTextElements > 0) {
    issues.push({
      category: 'mobile',
      severity: 'low',
      title: 'Text is too small to read on mobile',
      businessImpact: 'Visitors will have to pinch-to-zoom to read your content, ruining the reading experience.',
      technicalDetail: `${result.smallTextElements} elements have a computed font-size of less than 12px.`,
      fix: 'Ensure your base body text is at least 16px, and fine print is no smaller than 12px.',
      effort: 'low',
    });
  }

  result.issues = issues;

  return { result, issues };
}
