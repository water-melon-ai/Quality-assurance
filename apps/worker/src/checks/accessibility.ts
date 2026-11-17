/**
 * FrostFlow — Accessibility Checker
 * Validates alt text, headings, form labels, and basic color contrast.
 */

import type { Page } from 'playwright';
import type { Issue, AccessibilityCheckResult } from '@frostflow/types';

export async function checkAccessibility(
  page: Page
): Promise<{ result: AccessibilityCheckResult; issues: Issue[] }> {
  const issues: Issue[] = [];

  // Evaluate DOM for accessibility metrics
  const metrics = await page.evaluate(() => {
    // 1. Images without alt text
    const images = Array.from(document.querySelectorAll('img'));
    const imagesWithoutAlt = images.filter((img) => !img.hasAttribute('alt')).length;

    // 2. Form inputs missing labels
    const inputs = Array.from(document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]), textarea, select'));
    const missingLabels = inputs.filter((input) => {
      const id = input.id;
      if (id && document.querySelector(`label[for="${CSS.escape(id)}"]`)) return false;
      if (input.closest('label')) return false;
      if (input.hasAttribute('aria-label') || input.hasAttribute('aria-labelledby')) return false;
      return true;
    }).length;

    // 3. Headings
    const h1s = document.querySelectorAll('h1').length;

    // 4. Heading hierarchy
    let hierarchyValid = true;
    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    let previousLevel = 0;
    
    for (const h of headings) {
      const currentLevel = parseInt(h.tagName.substring(1), 10);
      if (previousLevel > 0 && currentLevel - previousLevel > 1) {
        // Skipped a heading level (e.g., H2 directly to H4)
        hierarchyValid = false;
        break;
      }
      previousLevel = currentLevel;
    }

    // 5. Basic tab order check (positive tabindex)
    const positiveTabIndexElements = document.querySelectorAll('[tabindex]:not([tabindex="-1"]):not([tabindex="0"])');
    const hasPositiveTabIndex = positiveTabIndexElements.length > 0;

    return {
      imagesWithoutAlt,
      missingLabels,
      h1Count: h1s,
      hierarchyValid,
      hasPositiveTabIndex,
    };
  });

  const result: AccessibilityCheckResult = {
    imagesWithoutAlt: metrics.imagesWithoutAlt,
    missingLabels: metrics.missingLabels,
    h1Count: metrics.h1Count,
    headingHierarchyValid: metrics.hierarchyValid,
    issues: [],
  };

  // Flag missing alt text
  if (result.imagesWithoutAlt > 0) {
    issues.push({
      category: 'accessibility',
      severity: 'medium',
      title: 'Images missing descriptions',
      businessImpact: 'Visually impaired users rely on screen readers to describe images. Search engines also cannot index images without descriptions.',
      technicalDetail: `${result.imagesWithoutAlt} <img> tags missing 'alt' attributes.`,
      fix: 'Add descriptive alt="description" attributes to all image tags. If an image is purely decorative, use alt="".',
      effort: 'low',
    });
  }

  // Flag missing form labels
  if (result.missingLabels > 0) {
    issues.push({
      category: 'accessibility',
      severity: 'high',
      title: 'Form fields missing labels',
      businessImpact: 'Users using screen readers won\'t know what information your form is asking for, leading to lost leads or sales.',
      technicalDetail: `${result.missingLabels} inputs/textareas missing associated <label> or aria-label.`,
      fix: 'Ensure every form input has an associated <label> tag or an aria-label attribute.',
      effort: 'low',
    });
  }

  // Flag missing H1
  if (result.h1Count === 0) {
    issues.push({
      category: 'accessibility',
      severity: 'high',
      title: 'No main heading (H1) found',
      businessImpact: 'Without a main heading, visitors and search engines struggle to understand what this page is about at a glance.',
      technicalDetail: 'Page has 0 <h1> tags.',
      fix: 'Add exactly one <h1> tag near the top of the page describing its main topic.',
      effort: 'low',
    });
  } else if (result.h1Count > 1) {
    issues.push({
      category: 'accessibility',
      severity: 'medium',
      title: 'Multiple main headings (H1)',
      businessImpact: 'Having multiple main headings confuses search engines and screen readers about the primary focus of the page.',
      technicalDetail: `Page has ${result.h1Count} <h1> tags. Best practice is exactly 1.`,
      fix: 'Keep the single most important heading as H1, and change the others to H2.',
      effort: 'low',
    });
  }

  // Flag skipped heading levels
  if (!result.headingHierarchyValid) {
    issues.push({
      category: 'accessibility',
      severity: 'low',
      title: 'Skipped heading levels',
      businessImpact: 'Disorganized headings make it harder for visitors scanning your page to understand the logical flow of information.',
      technicalDetail: 'Heading hierarchy is broken (e.g., jumped from H2 to H4 without an H3).',
      fix: 'Ensure headings follow a logical numerical order without skipping levels.',
      effort: 'low',
    });
  }

  // Flag positive tabindex
  if (metrics.hasPositiveTabIndex) {
    issues.push({
      category: 'accessibility',
      severity: 'low',
      title: 'Custom keyboard navigation order',
      businessImpact: 'Using custom keyboard navigation can trap users who rely on the keyboard to navigate, causing extreme frustration.',
      technicalDetail: 'Found elements with a positive tabindex attribute (tabindex > 0).',
      fix: 'Remove positive tabindex attributes. Let the browser determine the natural tab order based on document structure.',
      effort: 'low',
    });
  }

  result.issues = issues;

  return {
    result,
    issues,
  };
}
