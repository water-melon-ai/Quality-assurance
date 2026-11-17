/**
 * FrostFlow — Queue Consumer Setup
 * Used by the worker app to process jobs
 */

import { Worker, type Processor } from 'bullmq';
import { connection } from './connection';
import { QUEUE_NAME } from './producer';

/**
 * Create a BullMQ worker
 * @param processor The function that processes each job
 * @param concurrency How many jobs to process in parallel
 */
export function createWorker(processor: Processor, concurrency = 1) {
  const worker = new Worker(QUEUE_NAME, processor, {
    connection,
    concurrency,
    // Add any global worker options here
  });

  worker.on('failed', (job, err) => {
    console.error(`[Worker] Job ${job?.id} failed:`, err.message);
  });

  worker.on('error', (err) => {
    console.error(`[Worker] Internal error:`, err.message);
  });

  return worker;
}
