/**
 * FrostFlow — Results API Routes
 * GET /api/results/:id
 */

import type { FastifyInstance } from 'fastify';
import * as database from '@frostflow/database';
import { getUserId } from '../middleware';

export default async function resultRoutes(fastify: FastifyInstance) {
  fastify.get<{ Params: { id: string } }>('/api/results/:id', async (req, reply) => {
    const result = await database.results.getResultById(req.params.id);
    if (!result) return reply.status(404).send({ success: false, error: 'Report not found.' });

    // Anonymous scans are viewable by link; scans owned by a user only by that user
    const { userId: ownerId, ...job } = result.job;
    if (ownerId !== null && ownerId !== getUserId(req)) {
      return reply.status(403).send({ success: false, error: 'You do not have access to this report.' });
    }

    const { reports, ...rest } = result;
    return reply.send({ success: true, data: { ...rest, job, report: reports[0] ?? null } });
  });
}
