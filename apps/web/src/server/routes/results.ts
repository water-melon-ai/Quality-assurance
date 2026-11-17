import { Router } from 'express';
import { workerFetch } from '../lib/worker';

const router = Router();

router.get('/:id', async (req, res) => {
  const { status, data } = await workerFetch(`/api/results/${encodeURIComponent(req.params.id)}`, {
    userId: req.user?.id ?? null,
  });
  return res.status(status).json(data);
});

export default router;
