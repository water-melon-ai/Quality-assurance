/**
 * FrostFlow — GlassButton
 * Primary and ghost buttons with liquid glass effects.
 */

'use client';

import { forwardRef } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface GlassButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  children?: React.ReactNode;
  variant?: 'primary' | 'ghost' | 'icon';
  size?: 'sm' | 'base' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  className?: string;
}

export const GlassButton = forwardRef<HTMLButtonElement, GlassButtonProps>(
  (
    {
      variant = 'primary',
      size = 'base',
      isLoading = false,
      leftIcon,
      rightIcon,
      className,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    // Determine base classes from glass.css
    let baseClass = 'btn-primary';
    if (variant === 'ghost') baseClass = 'btn-ghost';
    if (variant === 'icon') baseClass = 'btn-icon';

    // Determine size modifiers
    let sizeClass = '';
    if (variant !== 'icon') {
      if (size === 'sm') sizeClass = variant === 'primary' ? 'btn-primary-sm' : 'btn-ghost-sm';
      // 'base' is default in CSS
    }

    const isDisabled = disabled || isLoading;

    return (
      <motion.button
        ref={ref}
        disabled={isDisabled}
        className={cn(
          baseClass,
          sizeClass,
          isDisabled && 'opacity-60 cursor-not-allowed',
          className
        )}
        // We handle hover/tap mostly in CSS for performance, but we can add
        // slight motion overrides if needed, though CSS `transform: scale()` is usually enough.
        // For absolute consistency with Framer components, we'll let CSS do the hover,
        // and just use motion for layout transitions if needed.
        whileTap={{ scale: isDisabled ? 1 : 0.98 }}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
        {!isLoading && leftIcon && <span className="mr-2 inline-flex">{leftIcon}</span>}
        {children}
        {!isLoading && rightIcon && <span className="ml-2 inline-flex">{rightIcon}</span>}
      </motion.button>
    );
  }
);

GlassButton.displayName = 'GlassButton';
