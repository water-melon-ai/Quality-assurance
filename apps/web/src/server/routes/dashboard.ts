import { Router } from 'express';
import * as database from '@frostflow/database';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

router.get('/stats', async (req, res) => {
  const userId = req.user!.id;
  try {
    const [recent, total, avg, monitors, usage] = await Promise.all([
      database.jobs.getRecentJobsForDashboard(userId),
      database.prisma.job.count({ where: { userId } }),
      database.prisma.result.aggregate({ _avg: { score: true }, where: { job: { userId } } }),
      database.prisma.monitor.count({ where: { userId, active: true } }),
      database.usage.getTodayUsage(userId),
    ]);

    const avgScore = avg._avg.score === null ? null : Math.round(avg._avg.score);

    return res.json({
      success: true,
      data: {
        recent,
        total,
        avgScore,
        activeMonitors: monitors,
        testsToday: usage?.testsRun ?? 0,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Failed to fetch dashboard stats' });
  }
});

router.get('/reports', async (req, res) => {
  const userId = req.user!.id;
  try {
    const results = await database.prisma.result.findMany({
      where: { job: { userId } },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        score: true,
        grade: true,
        createdAt: true,
        job: { select: { url: true } },
        reports: { orderBy: { createdAt: 'desc' }, take: 1, select: { pdfUrl: true } },
      },
    });
    return res.json({ success: true, data: results });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Failed to fetch reports' });
  }
});

router.get('/usage', async (req, res) => {
  const userId = req.user!.id;
  const usage = await database.usage.getTodayUsage(userId);
  return res.json({ success: true, data: { testsToday: usage?.testsRun ?? 0 } });
});

export default router;
