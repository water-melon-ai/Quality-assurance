/**
 * FrostFlow — Framer Motion Variants
 * Centralized animation variants for consistent, physics-based motion.
 * Import and use with <motion.div variants={fadeUp} ...> etc.
 */

import { type Variants, type Transition } from 'framer-motion';

// ─── Transitions ──────────────────────────────────────────────────────────────

export const easeOut: Transition = {
  duration: 0.4,
  ease: 'easeOut',
};

export const spring: Transition = {
  type: 'spring',
  stiffness: 200,
  damping: 24,
};

export const springGentle: Transition = {
  type: 'spring',
  stiffness: 140,
  damping: 20,
};

// ─── Page Transitions ─────────────────────────────────────────────────────────

/** Every page: fade + slight Y shift */
export const pageTransition: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: easeOut },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.25, ease: 'easeIn' } },
};

// ─── Reveal Variants ──────────────────────────────────────────────────────────

/** Fade up — standard section reveal */
export const fadeUp: Variants = {
  hidden:  { opacity: 0, y: 32 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

/** Fade in — no movement */
export const fadeIn: Variants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5, ease: 'easeOut' } },
};

/** Scale up reveal */
export const scaleUp: Variants = {
  hidden:  { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

// ─── Stagger Container ────────────────────────────────────────────────────────

/** Wrap staggered children with this on the parent */
export const staggerContainer: Variants = {
  hidden:  { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

/** Each child of a stagger container */
export const staggerChild: Variants = {
  hidden:  { opacity: 0, y: 24, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

// ─── Card Interactions ────────────────────────────────────────────────────────

/** Card hover — lift + scale */
export const cardHover = {
  whileHover: {
    scale: 1.02,
    y: -4,
    transition: { duration: 0.2, ease: 'easeOut' },
  },
  whileTap: {
    scale: 0.98,
    transition: { duration: 0.1 },
  },
};

// ─── Expandable Issue Cards ───────────────────────────────────────────────────

/** The expanded content panel inside an issue card */
export const issueExpand: Variants = {
  collapsed: {
    height: 0,
    opacity: 0,
    transition: { ...spring, duration: 0.3 },
  },
  expanded: {
    height: 'auto',
    opacity: 1,
    transition: spring,
  },
};

// ─── Loading ──────────────────────────────────────────────────────────────────

/** Frost-colored spinner ring */
export const spinnerVariants = {
  animate: {
    rotate: 360,
    transition: {
      repeat: Infinity,
      duration: 1.2,
      ease: 'linear',
    },
  },
};

// ─── AI Report Typing ─────────────────────────────────────────────────────────

/** Container for typing effect — stagger each character/word */
export const typingContainer: Variants = {
  hidden:  { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03,
    },
  },
};

/** Each character/word in the typing animation */
export const typingCharacter: Variants = {
  hidden:  { opacity: 0, y: 4 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.12, ease: 'easeOut' },
  },
};

// ─── Log Lines ────────────────────────────────────────────────────────────────

/** New log line appearing */
export const logLine: Variants = {
  hidden:  { opacity: 0, x: -8 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.25, ease: 'easeOut' },
  },
};

// ─── Modal / Dialog ───────────────────────────────────────────────────────────

export const modalOverlay: Variants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit:    { opacity: 0, transition: { duration: 0.15 } },
};

export const modalContent: Variants = {
  hidden:  { opacity: 0, scale: 0.96, y: 16 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: spring,
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: 8,
    transition: { duration: 0.2, ease: 'easeIn' },
  },
};

// ─── Step Cards (test progress page) ─────────────────────────────────────────

/** Each step card enters from bottom */
export const stepCard: Variants = {
  hidden:  { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: spring,
  },
};
