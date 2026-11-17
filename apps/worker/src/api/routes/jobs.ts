/**
 * FrostFlow — Jobs API Routes
 * POST /api/jobs, GET /api/jobs/:id/status
 */

import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import * as database from '@frostflow/database';
import { enqueueTestJob } from '@frostflow/queue';
import type { Tier } from '@frostflow/types';
import { getClientIp, getUserId, rateLimit } from '../middleware';
import { assertPublicUrl, UrlNotAllowedError } from '../../security/url';
import { runScan } from '../../orchestrator';

const createJobSchema = z.object({ url: z.string().url().max(2048) });

export default async function jobRoutes(fastify: FastifyInstance) {
  fastify.post('/api/jobs', { preHandler: [rateLimit] }, async (req, reply) => {
    const parsed = createJobSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ success: false, error: 'Please enter a valid URL.', code: 'INVALID_URL' });
    }

    let url: string;
    try {
      url = (await assertPublicUrl(parsed.data.url)).href;
    } catch (err) {
      if (err instanceof UrlNotAllowedError) {
        return reply.status(400).send({ success: false, error: err.message, code: 'URL_NOT_ALLOWED' });
      }
      throw err;
    }

    const userId = getUserId(req);
    // Everything is free - all users get full features (AI reports, PDF, multi-page crawling)
    const tier: Tier = 'agency';
    const maxPages = parseInt(process.env['MAX_PAGES_HARD_CAP'] || '25', 10);

    if (userId) {
      const user = await database.users.getUserById(userId);
      if (!user) return reply.status(401).send({ success: false, error: 'User not found.', code: 'USER_NOT_FOUND' });
    }

    const job = await database.jobs.createJob({ url, tier, userId: userId ?? null });

    let queued = false;
    try {
      await enqueueTestJob({ jobId: job.id, url, tier, userId: userId ?? null, maxPages });
      queued = true;
    } catch (err) {
      fastify.log.warn('[worker] Scan queue unavailable, running scan directly in process...');
    }

    if (!queued) {
      // Direct execution fallback: runs asynchronously in background!
      void runScan({ jobId: job.id, url, tier, userId: userId ?? null, maxPages }).catch(async (scanErr) => {
        const message = scanErr instanceof Error ? scanErr.message : String(scanErr);
        fastify.log.error(`[worker] direct scan ${job.id} failed:`, message);
        await database.jobs.failJob(job.id, message.slice(0, 500));
      });
    }

    // Count usage only once the job really exists
    if (userId) await database.usage.incrementTestsRun(userId);
    else await database.usage.incrementIpTestCount(getClientIp(req));

    return reply.send({ success: true, data: { jobId: job.id } });
  });

  fastify.get<{ Params: { id: string } }>('/api/jobs/:id/status', async (req, reply) => {
    const job = await database.jobs.getJobStatus(req.params.id);
    if (!job) return reply.status(404).send({ success: false, error: 'Job not found.' });

    const { result, ...rest } = job;
    return reply.send({ success: true, data: { ...rest, resultId: result?.id ?? null } });
  });
}
