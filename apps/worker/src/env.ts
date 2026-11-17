/** Loads the monorepo-root .env for local dev. In production, real env vars are used. */
import { config } from 'dotenv';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

for (const p of [resolve(process.cwd(), '.env'), resolve(process.cwd(), '../../.env')]) {
  if (existsSync(p)) {
    config({ path: p });
    break;
  }
}
