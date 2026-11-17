import { Router } from 'express';
import { workerFetch } from '../lib/worker';

const router = Router();

function normalizeUrl(url: string): string {
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return `https://${url}`;
  }
  return url;
}

function clientIp(req: any): string | null {
  return (
    req.headers['x-real-ip'] ||
    (typeof req.headers['x-forwarded-for'] === 'string' ? req.headers['x-forwarded-for'].split(',')[0]?.trim() : null) ||
    req.ip ||
    null
  );
}

router.post('/', async (req, res) => {
  const url = req.body?.url;
  if (!url || typeof url !== 'string' || !url.trim()) {
    return res.status(400).json({ success: false, error: 'Please enter a website URL.' });
  }

  const { status, data } = await workerFetch('/api/jobs', {
    method: 'POST',
    body: { url: normalizeUrl(url.trim()) },
    userId: req.user?.id ?? null,
    ip: clientIp(req),
  });

  return res.status(status).json(data);
});

router.get('/:id/status', async (req, res) => {
  const { status, data } = await workerFetch(`/api/jobs/${encodeURIComponent(req.params.id)}/status`);
  return res.status(status).json(data);
});

export default router;
