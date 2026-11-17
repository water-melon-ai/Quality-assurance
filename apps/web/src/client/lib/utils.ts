/**
 * FrostFlow — General Utilities
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// ─── Class Name Utility ───────────────────────────────────────────────────────

/** Merge Tailwind classes safely */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Score Utilities ──────────────────────────────────────────────────────────

export type Grade = 'A' | 'B' | 'C' | 'D' | 'F';

export function getGrade(score: number): Grade {
  if (score >= 90) return 'A';
  if (score >= 75) return 'B';
  if (score >= 60) return 'C';
  if (score >= 40) return 'D';
  return 'F';
}

export function getScoreColor(score: number): string {
  if (score >= 90) return 'var(--safe)';
  if (score >= 75) return 'var(--ice-400)';
  if (score >= 60) return 'var(--medium)';
  if (score >= 40) return 'var(--high)';
  return 'var(--critical)';
}

export function getGradeLabel(grade: Grade): string {
  const labels: Record<Grade, string> = {
    A: 'Excellent',
    B: 'Good',
    C: 'Fair',
    D: 'Poor',
    F: 'Critical',
  };
  return labels[grade];
}

// ─── Severity ─────────────────────────────────────────────────────────────────

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'safe';

export function getSeverityColor(severity: Severity): string {
  const colors: Record<Severity, string> = {
    critical: 'var(--critical)',
    high:     'var(--high)',
    medium:   'var(--medium)',
    low:      'var(--low)',
    safe:     'var(--safe)',
  };
  return colors[severity];
}

export function getSeverityScore(severity: Severity): number {
  const deductions: Record<Severity, number> = {
    critical: 25,
    high:     10,
    medium:   4,
    low:      1,
    safe:     0,
  };
  return deductions[severity];
}

// ─── URL Utilities ────────────────────────────────────────────────────────────

export function normalizeUrl(url: string): string {
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return `https://${url}`;
  }
  return url;
}

export function extractDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(normalizeUrl(url));
    return true;
  } catch {
    return false;
  }
}

// ─── Date Utilities ───────────────────────────────────────────────────────────

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function timeAgo(date: Date | string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(date).getTime()) / 1000
  );
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ─── Number Utilities ─────────────────────────────────────────────────────────

export function formatNumber(n: number): string {
  return n.toLocaleString('en-US');
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatMs(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

// ─── Share Token ──────────────────────────────────────────────────────────────

export function generateShareToken(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 12; i++) {
    token += chars[Math.floor(Math.random() * chars.length)];
  }
  return token;
}
