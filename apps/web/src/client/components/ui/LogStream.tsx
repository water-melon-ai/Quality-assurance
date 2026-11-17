/**
 * FrostFlow — LogStream
 * Displays a live, auto-scrolling terminal-like output of test progress.
 */

'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { logLine as logLineVariants } from '@/lib/animations';
import { cn } from '@/lib/utils';
import type { LogLine } from '@frostflow/types';

export interface LogStreamProps {
  logs: LogLine[];
  className?: string;
}

export function LogStream({ logs, className }: LogStreamProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  const getColorClass = (level: LogLine['level']) => {
    switch (level) {
      case 'ok': return 'log-line-ok';
      case 'warn': return 'log-line-warn';
      case 'error': return 'log-line-err';
      case 'info':
      default: return 'log-line-info';
    }
  };

  return (
    <div 
      ref={containerRef}
      className={cn("log-stream", className)}
    >
      <AnimatePresence initial={false}>
        {logs.map((log, index) => (
          <motion.div
            key={`${index}-${log.timestamp}`}
            variants={logLineVariants}
            initial="hidden"
            animate="visible"
            className="flex gap-4 mb-1"
          >
            <span className="text-white/20 whitespace-nowrap select-none">
              {new Date(log.timestamp).toISOString().split('T')[1]?.substring(0, 8)}
            </span>
            <span className={getColorClass(log.level)}>
              {log.message}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
