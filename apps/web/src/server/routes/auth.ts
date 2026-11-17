import { Router } from 'express';
import * as database from '@frostflow/database';
import { hashPassword, verifyPassword } from '../lib/password';
import { createSession, invalidateSession } from '../lib/session';

const router = Router();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DUMMY_HASH = 'scrypt$00000000000000000000000000000000$' + '00'.repeat(64);

router.get('/me', (req, res) => {
  return res.json({
    success: true,
    user: req.user ?? null,
  });
});

router.post('/sign-in', async (req, res) => {
  const email = String(req.body?.email ?? '').trim().toLowerCase();
  const password = String(req.body?.password ?? '');

  if (!EMAIL_RE.test(email) || !password) {
    return res.status(400).json({ success: false, error: 'Please enter a valid email and password.' });
  }

  const user = await database.users.getUserByEmail(email);
  const ok = await verifyPassword(user?.hashedPassword ?? DUMMY_HASH, password);
  if (!user || !ok) {
    return res.status(401).json({ success: false, error: 'Incorrect email or password.' });
  }

  const session = await createSession(user.id);
  res.cookie('auth_session', session.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: session.expiresAt,
  });

  return res.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      tier: user.tier,
      agencyName: user.agencyName,
      logoUrl: user.logoUrl,
    },
  });
});

router.post('/sign-up', async (req, res) => {
  const email = String(req.body?.email ?? '').trim().toLowerCase();
  const password = String(req.body?.password ?? '');

  if (!EMAIL_RE.test(email) || email.length > 254) {
    return res.status(400).json({ success: false, error: 'Please enter a valid email address.' });
  }
  if (password.length < 8 || password.length > 128) {
    return res.status(400).json({ success: false, error: 'Password must be between 8 and 128 characters.' });
  }

  const existing = await database.users.getUserByEmail(email);
  if (existing) {
    return res.status(409).json({ success: false, error: 'An account with this email already exists.' });
  }

  try {
    const hashedPassword = await hashPassword(password);
    const user = await database.users.createUser({ email, hashedPassword });
    const session = await createSession(user.id);

    res.cookie('auth_session', session.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: session.expiresAt,
    });

    return res.status(201).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        tier: user.tier,
        agencyName: user.agencyName,
        logoUrl: user.logoUrl,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Could not create account. Please try again.' });
  }
});

router.post('/sign-out', async (req, res) => {
  if (req.sessionId) {
    await invalidateSession(req.sessionId);
  }
  res.clearCookie('auth_session');
  return res.json({ success: true });
});

export default router;
