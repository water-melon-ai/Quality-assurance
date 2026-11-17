/**
 * FrostFlow — GlassCard
 * Core surface component using the Liquid Glass UI system.
 */

'use client';

import { forwardRef } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';
import { cardHover } from '@/lib/animations';

export interface GlassCardProps extends HTMLMotionProps<'div'> {
  variant?: 'default' | 'elevated' | 'frost' | 'ice';
  interactive?: boolean;
  innerGlow?: boolean;
  className?: string;
  children: React.ReactNode;
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  (
    {
      variant = 'default',
      interactive = false,
      innerGlow = false,
      className,
      children,
      ...props
    },
    ref
  ) => {
    // Map variants to our glass.css classes
    const variantClasses = {
      default: 'glass-card',
      elevated: 'glass-card-elevated',
      frost: 'glass-frost',
      ice: 'glass-ice',
    };

    const baseClass = variantClasses[variant];

    return (
      <motion.div
        ref={ref}
        className={cn(
          baseClass,
          interactive && 'glass-card-interactive cursor-pointer',
          innerGlow && 'glass-inner-glow',
          className
        )}
        // Apply physics-based hover if interactive
        {...(interactive ? cardHover : {})}
        {...props}
      >
        {/* We wrap children in a relative div so the innerGlow absolute pseudo-element stays behind content */}
        <div className="relative z-10 w-full h-full">
          {children}
        </div>
      </motion.div>
    );
  }
);

GlassCard.displayName = 'GlassCard';
