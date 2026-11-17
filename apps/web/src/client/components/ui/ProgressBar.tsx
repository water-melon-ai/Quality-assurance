/**
 * FrostFlow — ProgressBar
 * Full width glass track with linear-gradient fill. Animated with GSAP.
 */

'use client';

import { useEffect, useRef } from 'react';
import { animateProgressBar, counterAnimation } from '@/lib/gsap';
import { cn } from '@/lib/utils';

export interface ProgressBarProps {
  progress: number; // 0-100
  className?: string;
  showPercent?: boolean;
}

export function ProgressBar({ progress, className, showPercent = true }: ProgressBarProps) {
  const fillRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (fillRef.current) {
      animateProgressBar(fillRef.current, progress);
    }
    if (showPercent && textRef.current) {
      counterAnimation(textRef.current, progress, '', '%');
    }
  }, [progress, showPercent]);

  return (
    <div className={cn("w-full flex items-center gap-4", className)}>
      <div className="progress-track flex-1">
        <div 
          ref={fillRef}
          className="progress-fill" 
          style={{ width: '0%' }} // Initial state, GSAP animates this
        />
      </div>
      {showPercent && (
        <span 
          ref={textRef} 
          className="font-mono text-xs font-medium text-frost-300 w-10 text-right"
        >
          0%
        </span>
      )}
    </div>
  );
}
