/**
 * FrostFlow — SEO Checker
 * Checks for basic SEO tags, descriptions, Open Graph, and canonical URL.
 */

import type { Page } from 'playwright';
import type { Issue, SeoCheckResult } from '@frostflow/types';

export async function checkSeo(
  page: Page
): Promise<{ result: SeoCheckResult; issues: Issue[] }> {
  const issues: Issue[] = [];

  const metrics = await page.evaluate(() => {
    const titleText = document.title || null;
    const metaDesc = document.querySelector('meta[name="description"]')?.getAttribute('content') || null;
    
    const ogTitle = document.querySelector('meta[property="og:title"]')?.getAttribute('content') || null;
    const ogImage = document.querySelector('meta[property="og:image"]')?.getAttribute('content') || null;
    const ogDesc = document.querySelector('meta[property="og:description"]')?.getAttribute('content') || null;
    
    const canonical = document.querySelector('link[rel="canonical"]')?.getAttribute('href') || null;

    return {
      title: titleText,
      metaDescription: metaDesc,
      ogTitle: !!ogTitle,
      ogImage: !!ogImage,
      ogDescription: !!ogDesc,
      hasCanonical: !!canonical,
    };
  });

  const result: SeoCheckResult = {
    title: metrics.title,
    titleLength: metrics.title?.length || 0,
    metaDescription: metrics.metaDescription,
    metaDescriptionLength: metrics.metaDescription?.length || 0,
    hasOgTitle: metrics.ogTitle,
    hasOgImage: metrics.ogImage,
    hasOgDescription: metrics.ogDescription,
    hasCanonical: metrics.hasCanonical,
    issues: [],
  };

  // Title checks
  if (!result.title) {
    issues.push({
      category: 'seo',
      severity: 'high',
      title: 'Missing Page Title',
      businessImpact: 'Search engines do not know what to call your page in search results, severely hurting your rank and click-through rate.',
      technicalDetail: '<title> tag is missing or empty.',
      fix: 'Add a descriptive <title> inside the <head> of your HTML.',
      effort: 'low',
    });
  } else if (result.titleLength < 10) {
    issues.push({
      category: 'seo',
      severity: 'medium',
      title: 'Page Title is too short',
      businessImpact: 'A very short title gives search engines and users too little context about what makes your page valuable.',
      technicalDetail: `Title is only ${result.titleLength} characters (Recommended: 10-60).`,
      fix: 'Expand your title to include your brand and primary keywords.',
      effort: 'low',
    });
  } else if (result.titleLength > 60) {
    issues.push({
      category: 'seo',
      severity: 'medium',
      title: 'Page Title is too long',
      businessImpact: 'Google will cut off your title in search results with an ellipsis (...), which looks unprofessional and hides important words.',
      technicalDetail: `Title is ${result.titleLength} characters (Recommended: max 60).`,
      fix: 'Rewrite your title to be more concise while keeping primary keywords.',
      effort: 'low',
    });
  }

  // Description checks
  if (!result.metaDescription) {
    issues.push({
      category: 'seo',
      severity: 'high',
      title: 'Missing Meta Description',
      businessImpact: 'Without a description, Google will pick random text from your page to show in search results, which rarely makes a good sales pitch.',
      technicalDetail: '<meta name="description"> tag is missing.',
      fix: 'Add a meta description summarizing the page content to entice users to click.',
      effort: 'low',
    });
  } else if (result.metaDescriptionLength < 50 || result.metaDescriptionLength > 160) {
    issues.push({
      category: 'seo',
      severity: 'medium',
      title: 'Meta Description length is not optimal',
      businessImpact: 'If your description is too short, you waste a chance to pitch your value. If too long, Google will cut it off mid-sentence.',
      technicalDetail: `Description is ${result.metaDescriptionLength} characters (Recommended: 50-160).`,
      fix: 'Edit your meta description to be between 50 and 160 characters long.',
      effort: 'low',
    });
  }

  // Open Graph checks
  if (!result.hasOgImage || !result.hasOgTitle || !result.hasOgDescription) {
    issues.push({
      category: 'seo',
      severity: 'low',
      title: 'Incomplete Social Sharing (Open Graph) tags',
      businessImpact: 'When people share your link on Twitter, LinkedIn, or iMessage, it might appear as a plain link instead of a rich card with an image.',
      technicalDetail: `Missing: ${[!result.hasOgTitle && 'og:title', !result.hasOgImage && 'og:image', !result.hasOgDescription && 'og:description'].filter(Boolean).join(', ')}`,
      fix: 'Add the missing Open Graph (<meta property="og:...">) tags to ensure rich social previews.',
      effort: 'low',
    });
  }

  // Canonical check
  if (!result.hasCanonical) {
    issues.push({
      category: 'seo',
      severity: 'low',
      title: 'Missing Canonical URL',
      businessImpact: 'Search engines might get confused if this page can be accessed via multiple URLs (like with tracking parameters), splitting your SEO authority.',
      technicalDetail: '<link rel="canonical"> tag is missing.',
      fix: 'Add a canonical link pointing to the preferred, primary URL for this page.',
      effort: 'low',
    });
  }

  result.issues = issues;

  return { result, issues };
}
