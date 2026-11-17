/**
 * FrostFlow — Database Query Functions: Users
 * All user-related database operations
 */

import { prisma } from '../client';
import type { Tier } from '@prisma/client';


// ─── Get / Find ───────────────────────────────────────────────────────────────

export async function getUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
  });
}

export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });
}

// ─── Create ──────────────────────────────────────────────────────────────────

export async function createUser(data: { email: string; hashedPassword: string }) {
  return prisma.user.create({
    data: { email: data.email.toLowerCase(), hashedPassword: data.hashedPassword, tier: 'free' },
  });
}

// ─── Update ───────────────────────────────────────────────────────────────────

export async function updateUserTier(userId: string, tier: Tier) {
  return prisma.user.update({
    where: { id: userId },
    data: { tier },
  });
}

export async function updateUserBranding(
  userId: string,
  data: { agencyName?: string | null; logoUrl?: string | null }
) {
  return prisma.user.update({
    where: { id: userId },
    data,
  });
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export async function deleteUser(userId: string) {
  return prisma.user.delete({
    where: { id: userId },
  });
}
