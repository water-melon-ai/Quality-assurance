import type { Request, Response, NextFunction } from 'express';
import { validateSession } from '../lib/session';

export interface AuthenticatedUser {
  id: string;
  email: string;
  tier: string;
  agencyName: string | null;
  logoUrl: string | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser | null;
      sessionId?: string | null;
    }
  }
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const sessionId = req.cookies?.['auth_session'];
  if (!sessionId) {
    req.user = null;
    req.sessionId = null;
    return next();
  }

  const { session, user } = await validateSession(sessionId);
  if (!session || !user) {
    res.clearCookie('auth_session');
    req.user = null;
    req.sessionId = null;
    return next();
  }

  req.user = user;
  req.sessionId = session.id;
  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Unauthorized. Please sign in.' });
  }
  next();
}
