/**
 * FrostFlow — Fastify API Server
 * Internal API consumed by the Next.js app,.
 */

import fastify from 'fastify';
import cors from '@fastify/cors';
import jobRoutes from './routes/jobs';
import resultRoutes from './routes/results';
import monitorRoutes from './routes/monitors';
import { requireInternalKey } from './middleware';

export function createServer() {
  const server = fastify({ logger: true, trustProxy: true });

  const origins = (process.env['CORS_ORIGINS'] ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  server.register(cors, { origin: origins.length > 0 ? origins : false });

  server.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  // Everything under /api needs the internal key
  server.register(async (internal) => {
    internal.addHook('onRequest', requireInternalKey);
    await internal.register(jobRoutes);
    await internal.register(resultRoutes);
    await internal.register(monitorRoutes);
  });

  return server;
}
