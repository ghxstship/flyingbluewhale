"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState, type ReactNode } from "react";

/** Read a duration token (e.g. `--motion-slow: 360ms`) as seconds for
 *  framer-motion's `transition.duration` (which expects seconds, not ms).
 *  Falls back to `--motion-slow`'s default 0.36s if the token can't be
 *  resolved (SSR, before mount, etc.). */
function useMotionTokenSeconds(token: string, fallbackSeconds: number) {
  const [seconds, setSeconds] = useState(fallbackSeconds);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
    if (!raw) return;
    const ms = raw.endsWith("ms") ? parseFloat(raw) : raw.endsWith("s") ? parseFloat(raw) * 1000 : NaN;
    if (Number.isFinite(ms) && ms > 0) setSeconds(ms / 1000);
  }, [token]);
  return seconds;
}

// Mirrors the `--ease-out` token in theme/primitives.css.
const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

export function ScrollReveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const prefersReducedMotion = useReducedMotion();
  const duration = useMotionTokenSeconds("--motion-slow", 0.36);
  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{ duration, delay, ease: EASE_OUT }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
