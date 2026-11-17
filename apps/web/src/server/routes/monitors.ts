import { Router } from 'express';
import * as database from '@frostflow/database';
import { requireAuth } from '../middleware/auth';
import { workerFetch } from '../lib/worker';

const router = Router();

// All monitor routes require authentication
router.use(requireAuth);

router.get('/', async (req, res) => {
  const userId = req.user!.id;
  const monitors = await database.monitors.getMonitorsByUser(userId);
  return res.json({ success: true, data: monitors });
});

router.post('/', async (req, res) => {
  const userId = req.user!.id;
  const body = req.body;
  const { status, data } = await workerFetch('/api/monitors', {
    method: 'POST',
    body,
    userId,
  });
  return res.status(status).json(data);
});

router.delete('/:id', async (req, res) => {
  const userId = req.user!.id;
  await database.monitors.deleteMonitor(req.params.id, userId);
  return res.json({ success: true });
});

export default router;
