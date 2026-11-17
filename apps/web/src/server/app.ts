import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { authMiddleware } from './middleware/auth';
import authRoutes from './routes/auth';
import jobsRoutes from './routes/jobs';
import monitorsRoutes from './routes/monitors';
import resultsRoutes from './routes/results';
import dashboardRoutes from './routes/dashboard';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);

  // CORS
  const corsOrigins = (process.env['CORS_ORIGINS'] ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  app.use(
    cors({
      origin: corsOrigins.length > 0 ? corsOrigins : true,
      credentials: true,
    })
  );

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // Security headers
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  // Auth context for all requests
  app.use(authMiddleware);

  // Health
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/jobs', jobsRoutes);
  app.use('/api/monitors', monitorsRoutes);
  app.use('/api/results', resultsRoutes);
  app.use('/api/dashboard', dashboardRoutes);

  // Client static files in production
  // Locate dist/client directory
  const candidateDirs = [
    path.resolve(process.cwd(), 'dist/client'),
    path.resolve(__dirname, '../client'),
    path.resolve(__dirname, '../../dist/client'),
  ];
  const clientDist = candidateDirs.find((dir) => existsSync(dir));

  if (clientDist) {
    app.use(express.static(clientDist));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) {
        return next();
      }
      res.sendFile(path.join(clientDist, 'index.html'));
    });
  }

  return app;
}
