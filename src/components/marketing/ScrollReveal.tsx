"use client";

import { useEffect, useRef, type ReactNode, type ElementType } from "react";

/**
 * `<ScrollReveal>` — wraps children with an IntersectionObserver-driven
 * `data-reveal` toggle. Pairs with the `.reveal` CSS rules in globals.css.
 *
 * Initial state: `data-reveal="off"` (opacity 0, +8px translate). When the
 * element enters the viewport (default threshold 0.15) the attribute flips
 * to `"on"` and the global rule transitions opacity + transform. One-shot
 * by default — `repeat` re-arms the observer for play-on-scroll-back.
 *
 * The wrapper renders as `as` (default "div") so it can stand in for any
 * block-level container without extra DOM. Reduced-motion users get the
 * "on" state unconditionally via the media query in globals.css.
 *
 * `stagger` adds the `.reveal-stagger` class so direct children animate
 * in waves (60ms delay step) rather than as a single block.
 */
type ScrollRevealProps = {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  threshold?: number;
  stagger?: boolean;
  repeat?: boolean;
};

export function ScrollReveal({
  children,
  as: Tag = "div",
  className = "",
  threshold = 0.15,
  stagger = false,
  repeat = false,
}: ScrollRevealProps) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // SSR-safe default: the element renders WITHOUT `data-reveal` (fully
    // visible). On hydration, only hide it if (a) IntersectionObserver is
    // available, (b) we're not in reduced-motion mode, AND (c) it's below
    // the fold — otherwise leave content visible and skip the observer.
    // This way:
    //   - No-JS / SSR previews → content shows
    //   - Reduced-motion users → content shows immediately
    //   - Headless / IO-throttled environments → content shows
    //   - Real browsers, below-the-fold → reveal-on-scroll effect plays
    const prefersReduced =
      typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;
    if (typeof IntersectionObserver === "undefined") return;

    const r = node.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const aboveTheFold = r.top < vh && r.bottom > 0;
    if (aboveTheFold && !repeat) return;

    // Below-the-fold → hide first, then observe.
    node.setAttribute("data-reveal", "off");
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            node.setAttribute("data-reveal", "on");
            if (!repeat) obs.unobserve(node);
          } else if (repeat) {
            node.setAttribute("data-reveal", "off");
          }
        }
      },
      { threshold, rootMargin: "0px 0px -10% 0px" },
    );
    obs.observe(node);

    // Safety net — if the observer never fires (some headless browsers,
    // throttled tabs, certain CI test runners), flip on after 1500ms so
    // content never stays permanently hidden. A real browser fires the
    // observer well before this timer elapses, so users don't see this.
    const safety = window.setTimeout(() => {
      if (node.getAttribute("data-reveal") !== "on") {
        node.setAttribute("data-reveal", "on");
      }
    }, 1500);

    return () => {
      obs.disconnect();
      clearTimeout(safety);
    };
  }, [threshold, repeat]);

  const composed = `${stagger ? "reveal-stagger " : ""}${className}`.trim();

  return (
    <Tag ref={ref as never} className={composed}>
      {children}
    </Tag>
  );
}
