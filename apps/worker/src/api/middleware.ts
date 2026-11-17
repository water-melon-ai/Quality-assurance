/**
 * FrostFlow — API Middleware
 * Internal-key auth (web → worker), rate limiting and tier enforcement.
 */

import { timingSafeEqual } from 'node:crypto';
import type { FastifyRequest, FastifyReply } from 'fastify';
import * as database from '@frostflow/database';

/** The worker API is server-to-server only: every non-webhook request must carry INTERNAL_API_KEY. */
export async function requireInternalKey(req: FastifyRequest, reply: FastifyReply) {
  const expected = process.env['INTERNAL_API_KEY'];
  const given = req.headers['x-internal-key'];
  if (
    !expected ||
    typeof given !== 'string' ||
    given.length !== expected.length ||
    !timingSafeEqual(Buffer.from(given), Buffer.from(expected))
  ) {
    return reply.status(401).send({ success: false, error: 'Unauthorized.', code: 'UNAUTHORIZED' });
  }
}

export function getUserId(req: FastifyRequest): string | undefined {
  const v = req.headers['x-user-id'];
  return typeof v === 'string' && v ? v : undefined;
}

export function getClientIp(req: FastifyRequest): string {
  const v = req.headers['x-client-ip'];
  return typeof v === 'string' && v ? v : req.ip;
}

export async function rateLimit(req: FastifyRequest, reply: FastifyReply) {
  // Free tier limit removed - completely free and unlimited scans for all users
  const userId = getUserId(req);
  if (userId) {
    const user = await database.users.getUserById(userId);
    if (!user) {
      return reply.status(401).send({ success: false, error: 'User not found.', code: 'USER_NOT_FOUND' });
    }
  }
}

/** Signed-in users get every feature for free — just require a valid account. */
export async function requireUser(req: FastifyRequest, reply: FastifyReply) {
  const userId = getUserId(req);
  if (!userId) {
    return reply.status(401).send({ success: false, error: 'You must be logged in.', code: 'UNAUTHORIZED' });
  }
  const user = await database.users.getUserById(userId);
  if (!user) {
    return reply.status(401).send({ success: false, error: 'User not found.', code: 'USER_NOT_FOUND' });
  }
  (req as FastifyRequest & { user?: typeof user }).user = user;
}
