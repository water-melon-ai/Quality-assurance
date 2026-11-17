/**
 * FrostFlow — Worker App Entrypoint
 * Boots the Fastify API, the BullMQ consumer and the monitor scheduler.
 */

import './env';
import { UnrecoverableError } from 'bullmq';
import { createWorker } from '@frostflow/queue';
import * as database from '@frostflow/database';
import type { MonitorJobPayload, TestJobPayload } from '@frostflow/types';
import { createServer } from './api/server';
import { closeBrowser, runScan } from './orchestrator';
import { markMonitorRunFailed, runMonitor, scheduleDueMonitors } from './monitor';
import { UrlNotAllowedError } from './security/url';

const PORT = parseInt(process.env['API_PORT'] || '4000', 10);
const CONCURRENCY = parseInt(process.env['WORKER_CONCURRENCY'] || '2', 10);
const SCHEDULER_INTERVAL_MS = 5 * 60_000;

async function bootstrap() {
  if (!process.env['INTERNAL_API_KEY']) {
    console.error('INTERNAL_API_KEY is not set — refusing to start (the API would be unauthenticated).');
    process.exit(1);
  }
  console.log('🧊 Starting FrostFlow worker…');

  const server = createServer();
  await server.listen({ port: PORT, host: '0.0.0.0' });

  let worker: any = null;
  try {
    worker = createWorker(async (job) => {
      const isFinalAttempt = job.attemptsMade + 1 >= (job.opts.attempts ?? 1);

      if (job.name === 'run-test') {
        const payload = job.data as TestJobPayload;
        try {
          await runScan(payload);
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          console.error(`[worker] scan ${payload.jobId} failed:`, message);
          if (err instanceof UrlNotAllowedError) {
            await database.jobs.failJob(payload.jobId, message);
            throw new UnrecoverableError(message);
          }
          if (isFinalAttempt) await database.jobs.failJob(payload.jobId, message.slice(0, 500));
          throw err;
        }
      } else if (job.name === 'run-monitor') {
        const payload = job.data as MonitorJobPayload;
        try {
          await runMonitor(payload);
        } catch (err) {
          console.error(`[worker] monitor ${payload.monitorId} failed:`, err);
          if (isFinalAttempt) await markMonitorRunFailed(payload.monitorId);
          throw err;
        }
      }
    }, CONCURRENCY);

    worker.on('error', (err: any) => {
      if (err?.code !== 'ECONNREFUSED') {
        console.warn('[worker] Queue warning:', err?.message || err);
      }
    });
  } catch (err) {
    console.warn('[worker] Running in direct scan mode (Redis queue offline)');
  }

  // Monitor scheduler
  const tick = () => scheduleDueMonitors().catch((err) => console.error('[scheduler]', err));
  const timer = setInterval(tick, SCHEDULER_INTERVAL_MS);
  void tick();

  let shuttingDown = false;
  const shutdown = async (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`${signal} received — shutting down…`);
    clearInterval(timer);
    if (worker) {
      await worker.close().catch(() => undefined);
    }
    await server.close().catch(() => undefined);
    await closeBrowser();
    await database.prisma.$disconnect().catch(() => undefined);
    process.exit(0);
  };
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

bootstrap().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
