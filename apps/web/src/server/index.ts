import { config } from 'dotenv';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { createApp } from './app';

// Load .env
for (const p of [resolve(process.cwd(), '.env'), resolve(process.cwd(), '../../.env')]) {
  if (existsSync(p)) {
    config({ path: p });
    break;
  }
}

const isProduction = process.env.NODE_ENV === 'production';
const defaultPort = isProduction ? 3000 : 3001;
const PORT = parseInt(process.env.PORT || String(defaultPort), 10);

const app = createApp();

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 FrostFlow Express server listening on http://0.0.0.0:${PORT} [${process.env.NODE_ENV || 'development'}]`);
});
