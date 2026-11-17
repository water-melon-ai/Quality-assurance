/**
 * FrostFlow — GlassInput
 * Translucent input field with glowing focus state.
 */

'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface GlassInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: 'default' | 'hero';
  icon?: React.ReactNode;
}

export const GlassInput = forwardRef<HTMLInputElement, GlassInputProps>(
  (
    {
      variant = 'default',
      icon,
      className,
      ...props
    },
    ref
  ) => {
    return (
      <div className="relative w-full">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-frost-300 opacity-60">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          className={cn(
            'glass-input w-full',
            variant === 'hero' && 'glass-input-hero',
            icon && 'pl-11', // Make room for left icon
            className
          )}
          {...props}
        />
      </div>
    );
  }
);

GlassInput.displayName = 'GlassInput';
