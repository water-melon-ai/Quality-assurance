import { randomBytes } from 'node:crypto';
import { prisma } from '@frostflow/database';

const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export async function createSession(userId: string) {
  const sessionId = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  const session = await prisma.session.create({
    data: {
      id: sessionId,
      userId,
      expiresAt,
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          tier: true,
          agencyName: true,
          logoUrl: true,
        },
      },
    },
  });

  return session;
}

export async function validateSession(sessionId: string | undefined | null) {
  if (!sessionId || typeof sessionId !== 'string') {
    return { session: null, user: null };
  }

  try {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            tier: true,
            agencyName: true,
            logoUrl: true,
          },
        },
      },
    });

    if (!session) {
      return { session: null, user: null };
    }

    // Check if expired
    if (Date.now() >= session.expiresAt.getTime()) {
      await prisma.session.delete({ where: { id: sessionId } }).catch(() => undefined);
      return { session: null, user: null };
    }

    return { session, user: session.user };
  } catch (err) {
    console.warn('[auth] Could not validate session from database (is database running?):', (err as any)?.message?.split('\n')[0] || err);
    return { session: null, user: null };
  }
}

export async function invalidateSession(sessionId: string) {
  if (!sessionId) return;
  try {
    await prisma.session.delete({ where: { id: sessionId } });
  } catch {
    // ignore
  }
}
