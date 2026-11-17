/**
 * FrostFlow — Queue Redis Connection
 */

import { Redis, type RedisOptions } from 'ioredis';

const REDIS_URL = process.env['REDIS_URL'] || process.env['UPSTASH_REDIS_URL'] || 'redis://127.0.0.1:6379';

const isUpstashOrTls = REDIS_URL.startsWith('rediss://');

const redisOptions: RedisOptions = {
  maxRetriesPerRequest: null, // BullMQ requires this to be null
  enableReadyCheck: false,
  retryStrategy(times) {
    if (times > 3) return null; // Stop retrying if Redis is not running locally
    return Math.min(times * 1000, 3000);
  },
  ...(isUpstashOrTls ? { tls: {} } : {}),
};

// Singleton Redis connection for BullMQ
export const connection = new Redis(REDIS_URL, redisOptions);

// Error handling to prevent unhandled promise rejections on connection failure
connection.on('error', (err) => {
  // Log once as warning instead of throwing unhandled
  if (err?.code !== 'ECONNREFUSED') {
    console.error('[Redis Error]', err);
  }
});
