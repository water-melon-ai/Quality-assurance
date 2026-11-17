/**
 * FrostFlow — AI Reporter
 * Translates raw QA issues into a plain-English consultant report using Gemini.
 */

import { GoogleGenerativeAI, SchemaType, type ResponseSchema } from '@google/generative-ai';
import type { Issue, GeminiReport, Score } from '@frostflow/types';

// Initialize the Gemini client
// In production, ensure GEMINI_API_KEY is available in the environment

// We define the JSON schema we want Gemini to adhere to.
const reportSchema: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    executiveSummary: {
      type: SchemaType.STRING,
      description: 'Max 3 sentences. High-level summary of the website health.',
    },
    whatIsWorkingWell: {
      type: SchemaType.STRING,
      description: 'Highlight the positive aspects of the site. Always find something positive.',
    },
    criticalIssues: {
      type: SchemaType.STRING,
      description: 'Explanation of critical issues. Return null if there are no critical issues.',
      nullable: true,
    },
    fixThisWeek: {
      type: SchemaType.STRING,
      description: 'Top 3 actions to take immediately. Formatted as a numbered list.',
    },
    lowerPriorityItems: {
      type: SchemaType.STRING,
      description: 'Other issues that can be fixed later.',
    },
    overallAssessment: {
      type: SchemaType.STRING,
      description: 'Final professional, calm, and constructive closing thought.',
    },
  },
  required: [
    'executiveSummary',
    'whatIsWorkingWell',
    'fixThisWeek',
    'lowerPriorityItems',
    'overallAssessment',
  ],
};

const SYSTEM_PROMPT = `You are a senior QA consultant writing a website audit report for a non-technical business owner.
Never use technical jargon. Explain every issue as a business consequence.
Be professional, calm, and constructive. Always find something positive first.

Translation rules:
- "CLS score X" -> "Page jumps around while loading"
- "LCP X" -> "Main content takes X seconds to load"
- "Missing CSP" -> "Key security setting missing"
- "No alt text" -> "Images hidden from screen readers"
- "H1 missing" -> "Page has no clear main heading"
- "404 on /path" -> "Broken link"
- "No viewport meta" -> "Site not set up for mobile"`;

export async function generateAiReport(
  url: string,
  score: Score,
  issues: Issue[]
): Promise<GeminiReport | null> {
  const apiKey = process.env['GEMINI_API_KEY'] || '';
  if (!apiKey) {
    console.warn('[Gemini] GEMINI_API_KEY not set. Skipping AI report generation.');
    return null;
  }

  const preferredModel = process.env['GEMINI_MODEL'] || 'gemini-3.5-flash-lite';
  const candidateModels = Array.from(
    new Set([preferredModel, 'gemini-3.5-flash-lite', 'gemini-3.1-flash-lite', 'gemini-3.8-flash'])
  );

  const genAI = new GoogleGenerativeAI(apiKey);

  // Prepare the payload for Gemini
  const criticalCount = issues.filter(i => i.severity === 'critical').length;
  const highCount = issues.filter(i => i.severity === 'high').length;

  // We only pass the most relevant fields to save tokens and keep the AI focused
  const issuesSummary = issues.slice(0, 40).map(i => ({
    severity: i.severity,
    title: i.title,
    businessImpact: i.businessImpact,
  }));

  const promptData = {
    websiteUrl: url,
    totalScore: score.total,
    grade: score.grade,
    issueCounts: {
      critical: criticalCount,
      high: highCount,
      total: issues.length,
    },
    issues: issuesSummary,
  };

  const promptText = `Please write the QA audit report based on the following raw data:\n\n${JSON.stringify(promptData, null, 2)}`;

  for (const modelName of candidateModels) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: reportSchema,
          temperature: 0.4,
        },
        systemInstruction: SYSTEM_PROMPT,
      });

      const result = await model.generateContent(promptText);
      const text = result.response.text();

      // Parse the JSON strictly into our interface
      const parsed = JSON.parse(text) as Partial<GeminiReport>;
      if (!parsed.executiveSummary || !parsed.fixThisWeek) continue;

      console.log(`[Gemini] Successfully generated AI report using ${modelName}`);
      return {
        executiveSummary: parsed.executiveSummary,
        whatIsWorkingWell: parsed.whatIsWorkingWell ?? '',
        criticalIssues: parsed.criticalIssues ?? null,
        fixThisWeek: parsed.fixThisWeek,
        lowerPriorityItems: parsed.lowerPriorityItems ?? '',
        overallAssessment: parsed.overallAssessment ?? '',
      };
    } catch (error) {
      console.warn(`[Gemini] Model ${modelName} failed, trying next fallback:`, error instanceof Error ? error.message : error);
    }
  }

  console.error('[Gemini] All fallback models failed to generate AI report.');
  return null;
}
