/**
 * FrostFlow — Monitors API Routes 
 * GET/POST /api/monitors, DELETE /api/monitors/:id
 */

import type { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import * as database from '@frostflow/database';
import { requireUser } from '../middleware';
import { assertPublicUrl, UrlNotAllowedError } from '../../security/url';

const createMonitorSchema = z.object({
  url: z.string().url().max(2048),
  schedule: z.enum(['every_6h', 'every_12h', 'every_24h']).optional(),
  alertEmail: z.string().email().optional().nullable(),
  slackWebhook: z.string().url().optional().nullable(),
  alertOnScoreDrop: z.number().int().min(1).max(100).optional(),
});

const userOf = (req: FastifyRequest) => (req as FastifyRequest & { user: { id: string } }).user;

export default async function monitorRoutes(fastify: FastifyInstance) {
  fastify.get('/api/monitors', { preHandler: [requireUser] }, async (req, reply) => {
    return reply.send({ success: true, data: await database.monitors.getMonitorsByUser(userOf(req).id) });
  });

  fastify.post('/api/monitors', { preHandler: [requireUser] }, async (req, reply) => {
    const parsed = createMonitorSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ success: false, error: parsed.error.issues.map((i) => i.message).join(', ') });
    }
    try {
      await assertPublicUrl(parsed.data.url);
    } catch (err) {
      if (err instanceof UrlNotAllowedError) return reply.status(400).send({ success: false, error: err.message });
      throw err;
    }
    const monitor = await database.monitors.createMonitor({ userId: userOf(req).id, ...parsed.data });
    return reply.send({ success: true, data: monitor });
  });

  fastify.delete<{ Params: { id: string } }>('/api/monitors/:id', { preHandler: [requireUser] }, async (req, reply) => {
    await database.monitors.deleteMonitor(req.params.id, userOf(req).id);
    return reply.send({ success: true });
  });
}
