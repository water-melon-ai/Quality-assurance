/**
 * FrostFlow — ScoreRing
 * SVG animated ring showing the overall test score.
 */

'use client';

import { useEffect, useRef } from 'react';
import { animateScoreRing, counterAnimation } from '@/lib/gsap';
import { getScoreColor } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface ScoreRingProps {
  score: number; // 0-100
  size?: number;
  strokeWidth?: number;
  className?: string;
  showNumber?: boolean;
}

export function ScoreRing({
  score,
  size = 180,
  strokeWidth = 12,
  className,
  showNumber = true,
}: ScoreRingProps) {
  const ringRef = useRef<SVGCircleElement>(null);
  const numberRef = useRef<HTMLSpanElement>(null);

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  useEffect(() => {
    if (ringRef.current) {
      animateScoreRing(ringRef.current, score, circumference);
    }
    if (showNumber && numberRef.current) {
      counterAnimation(numberRef.current, score);
    }
  }, [score, circumference, showNumber]);

  return (
    <div 
      className={cn("score-ring-container relative", className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          className="score-ring-track"
        />
        {/* Fill */}
        <circle
          ref={ringRef}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke={getScoreColor(score)}
          className="score-ring-fill drop-shadow-[0_0_12px_rgba(var(--color),0.5)]"
          // We inline the color var for the drop shadow to pick up
          style={{ '--color': getScoreColor(score) } as React.CSSProperties}
        />
      </svg>
      
      {showNumber && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span 
            ref={numberRef} 
            className="font-syne font-bold text-5xl tracking-tighter text-white"
          >
            0
          </span>
          <span className="font-mono text-xs text-frost-300 uppercase tracking-widest mt-1 opacity-60">
            Score
          </span>
        </div>
      )}
    </div>
  );
}
