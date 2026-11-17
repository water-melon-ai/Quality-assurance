/**
 * FrostFlow — SeverityBadge
 * Displays issue severity levels with specific glass pill styling and optional pulse dots.
 */

import { cn } from '@/lib/utils';
import type { Severity } from '@frostflow/types';

export interface SeverityBadgeProps {
  severity: Severity | 'safe';
  showDot?: boolean;
  className?: string;
}

export function SeverityBadge({ severity, showDot = false, className }: SeverityBadgeProps) {
  const badgeClasses: Record<string, string> = {
    critical: 'badge-critical',
    high:     'badge-high',
    medium:   'badge-medium',
    low:      'badge-low',
    safe:     'badge-safe',
  };

  const dotClasses: Record<string, string> = {
    critical: 'pulse-dot-red',
    high:     'bg-[#FF8C42]', // No pulse animation for non-critical by default, but colored
    medium:   'bg-[#F0C040]',
    low:      'pulse-dot-ice',
    safe:     'pulse-dot-green',
  };

  return (
    <span className={cn('inline-flex items-center gap-1.5', badgeClasses[severity], className)}>
      {showDot && (
        <span 
          className={cn(
            'block w-1.5 h-1.5 rounded-full', 
            severity === 'critical' ? 'pulse-dot pulse-dot-red' : dotClasses[severity]
          )} 
        />
      )}
      {severity}
    </span>
  );
}

/**
 * A generic glass pill component for categories, tags, etc.
 */
export function Pill({ 
  children, 
  variant = 'default',
  className 
}: { 
  children: React.ReactNode;
  variant?: 'default' | 'frost' | 'ice';
  className?: string;
}) {
  return (
    <span className={cn(
      'pill',
      variant === 'frost' && 'pill-frost',
      variant === 'ice' && 'pill-ice',
      className
    )}>
      {children}
    </span>
  );
}
