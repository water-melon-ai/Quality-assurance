/**
 * FrostFlow — Queue Producer
 * Used by the web API to enqueue jobs
 */

import { Queue } from 'bullmq';
import { connection } from './connection';
import type { TestJobPayload, MonitorJobPayload } from '@frostflow/types';

export const QUEUE_NAME = 'frostflow-jobs';

// ─── Queue Instance ───────────────────────────────────────────────────────────

export const testQueue = new Queue<TestJobPayload | MonitorJobPayload>(
  QUEUE_NAME,
  {
    connection,
    defaultJobOptions: {
      attempts: 2,
      backoff: {
        type: 'exponential',
        delay: 5000, // 5s, then 25s
      },
      removeOnComplete: true,
      removeOnFail: { age: 24 * 3600, count: 200 }, // Keep recent failures for debugging, then prune
    },
  }
);

// ─── Producer Functions ───────────────────────────────────────────────────────

/**
 * Enqueue a manual test run
 */
export async function enqueueTestJob(payload: TestJobPayload) {
  return testQueue.add('run-test', payload, {
    jobId: payload.jobId, // Ensure idempotency
  });
}

/**
 * Enqueue a scheduled monitor run
 */
export async function enqueueMonitorJob(payload: MonitorJobPayload) {
  return testQueue.add('run-monitor', payload, {
    // Monitor jobs shouldn't overlap if they get backed up
    // One in-flight run per monitor (BullMQ ids may not contain ':'); a duplicate add is ignored
    jobId: `monitor-${payload.monitorId}`,
    priority: 2,
    removeOnFail: true,
  });
}
