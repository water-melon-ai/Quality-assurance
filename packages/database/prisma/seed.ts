import { PrismaClient } from '@prisma/client';
import { scryptSync, randomBytes } from 'node:crypto';

const prisma = new PrismaClient();

// Same format as apps/web/lib/password.ts → login: test@frostflow.local / frostflow-demo
function hash(pw: string) {
  const salt = randomBytes(16);
  return `scrypt$${salt.toString('hex')}$${scryptSync(pw, salt, 64).toString('hex')}`;
}

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Create a dummy test user
  const user = await prisma.user.upsert({
    where: { email: 'test@frostflow.local' },
    update: {},
    create: {
      email: 'test@frostflow.local',
      hashedPassword: hash('frostflow-demo'),
      tier: 'agency',
      agencyName: 'Acme Agency',
    },
  });

  console.log('✅ Created user:', user.email);

  // 2. Create a dummy job
  const job = await prisma.job.create({
    data: {
      userId: user.id,
      url: 'https://example.com',
      status: 'done',
      tier: 'studio',
      pagesCrawled: 5,
      progress: 100,
      completedAt: new Date(),
    },
  });

  console.log('✅ Created job for:', job.url);

  // 3. Create a dummy result for the job
  const result = await prisma.result.create({
    data: {
      jobId: job.id,
      score: 72,
      grade: 'C',
      scoreBreakdown: {
        performance: 80,
        security: 90,
        accessibility: 65,
        seo: 85,
        links: 100,
        mobile: 60,
      },
      criticalCount: 1,
      highCount: 2,
      mediumCount: 4,
      lowCount: 5,
      passedChecks: 2, // e.g. links and security
      loadTimeMs: 2400,
      pageSizeBytes: 1500000,
      fcpMs: 800,
      lcpMs: 2500,
      rawData: {
        performance: {
          fcp: 800,
          lcp: 2500,
          cls: 0.1,
          loadTime: 2400,
          pageSize: 1500000,
          requestCount: 45,
        }
      }, // Simplified for seed
      geminiReport: {
        executiveSummary: "Example.com is generally stable but has critical issues affecting mobile usability and accessibility.",
        whatIsWorkingWell: "Your site loads reasonably fast and has good basic security headers in place.",
        criticalIssues: "The main hero text is too small on mobile devices, causing readability issues.",
        fixThisWeek: "1. Increase font size on mobile.\n2. Add alt text to the 3 missing images.",
        lowerPriorityItems: "Optimize 2 large images to improve load times slightly.",
        overallAssessment: "With a few quick fixes to mobile styling and accessibility, this site will be in great shape."
      },
      // Issues
      issues: {
        create: [
          {
            severity: 'critical',
            category: 'mobile',
            title: 'Text too small on mobile',
            businessImpact: 'Visitors on phones cannot read your main message without zooming in, causing frustration and high bounce rates.',
            technicalDetail: 'Font size is 11px on viewport width < 768px. Minimum recommended is 16px.',
            location: 'header .hero-subtitle',
            fix: 'Update your CSS media query for mobile to set font-size to at least 16px (or 1rem).',
            effort: 'low',
          },
          {
            severity: 'high',
            category: 'accessibility',
            title: 'Missing image descriptions',
            businessImpact: 'Visually impaired users cannot understand what your images show, and search engines cannot index them properly.',
            technicalDetail: '3 <img> tags missing alt attributes.',
            location: 'Homepage product grid',
            fix: 'Add descriptive alt="description of image" attributes to all image tags.',
            effort: 'low',
          }
        ]
      }
    }
  });

  console.log('✅ Created result and issues for job:', job.id);

  console.log('✨ Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
