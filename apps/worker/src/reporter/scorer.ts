/**
 * FrostFlow — Scorer
 * Calculates the final grade and score breakdown based on issues found.
 */

import type { Issue, Score, Grade, CheckCategory } from '@frostflow/types';

const DEDUCTIONS: Record<Issue['severity'], number> = { critical: 25, high: 10, medium: 4, low: 1 };
const CATEGORY_CAP = 50; // one noisy category (e.g. 30 broken links) can't zero the whole score

export function calculateScore(issues: Issue[]): Score {
  const lost: Record<CheckCategory, number> = {
    performance: 0, security: 0, accessibility: 0, seo: 0, links: 0, mobile: 0,
  };

  for (const issue of issues) {
    lost[issue.category] += DEDUCTIONS[issue.severity];
  }

  const breakdown = {} as Score['breakdown'];
  let totalLost = 0;
  for (const cat of Object.keys(lost) as CheckCategory[]) {
    const capped = Math.min(lost[cat], CATEGORY_CAP);
    breakdown[cat] = Math.max(0, 100 - lost[cat]);
    totalLost += capped;
  }
  const totalScore = Math.max(0, 100 - totalLost);

  // Determine grade based on total score
  let grade: Grade = 'F';
  if (totalScore >= 90) {
    grade = 'A';
  } else if (totalScore >= 75) {
    grade = 'B';
  } else if (totalScore >= 60) {
    grade = 'C';
  } else if (totalScore >= 40) {
    grade = 'D';
  }

  return {
    total: totalScore,
    grade,
    breakdown,
  };
}
