"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { Button } from "./Button";
import { useT } from "@/lib/i18n/LocaleProvider";

/**
 * Product-tour coachmarks.
 *
 * <Coachmark> is a single anchored bubble pointing at a target element.
 * <Tour> drives a sequence of steps with next/back/skip, a dimmed spotlight
 * cutout over the active target, focus management, and keyboard nav
 * (←/→ step, Esc skip). Honors reduced-motion via the shared --motion-* tokens.
 */

type Side = "top" | "bottom" | "left" | "right";

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

function resolveTarget(target: string | HTMLElement | null): HTMLElement | null {
  if (!target) return null;
  if (typeof target === "string") return document.querySelector<HTMLElement>(target);
  return target;
}

function measure(el: HTMLElement | null): Rect | null {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

/** Live rect of a target element, tracked through scroll/resize. */
function useTargetRect(target: string | HTMLElement | null): Rect | null {
  const [rect, setRect] = React.useState<Rect | null>(null);
  React.useEffect(() => {
    const el = resolveTarget(target);
    if (!el) {
      setRect(null);
      return;
    }
    const update = () => setRect(measure(el));
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(update) : null;
    ro?.observe(el);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
      ro?.disconnect();
    };
  }, [target]);
  return rect;
}

function bubblePosition(rect: Rect, side: Side, gap = 12): React.CSSProperties {
  switch (side) {
    case "top":
      return { top: rect.top - gap, left: rect.left + rect.width / 2, transform: "translate(-50%, -100%)" };
    case "left":
      return { top: rect.top + rect.height / 2, left: rect.left - gap, transform: "translate(-100%, -50%)" };
    case "right":
      return { top: rect.top + rect.height / 2, left: rect.left + rect.width + gap, transform: "translate(0, -50%)" };
    case "bottom":
    default:
      return { top: rect.top + rect.height + gap, left: rect.left + rect.width / 2, transform: "translate(-50%, 0)" };
  }
}

// ── Bubble ─────────────────────────────────────────────────────────────────

export interface CoachmarkBubbleContentProps {
  title: string;
  body?: React.ReactNode;
  side?: Side;
  /** Optional footer slot (e.g. the Tour controls). */
  footer?: React.ReactNode;
  onClose?: () => void;
  closeLabel?: string;
  labelledById: string;
  describedById: string;
}

const CoachmarkBubble = React.forwardRef<HTMLDivElement, CoachmarkBubbleContentProps & { style?: React.CSSProperties }>(
  function CoachmarkBubble(
    { title, body, footer, onClose, closeLabel, labelledById, describedById, style },
    ref,
  ) {
    return (
      <div
        ref={ref}
        role="dialog"
        aria-modal="false"
        aria-labelledby={labelledById}
        aria-describedby={body ? describedById : undefined}
        tabIndex={-1}
        style={style}
        className="surface-raised animate-scale-in pointer-events-auto fixed z-[calc(var(--p-z-tour)+1)] w-72 rounded-[var(--p-r-md)] border border-[var(--p-border)] p-4 outline-none"
      >
        <div className="flex items-start justify-between gap-2">
          <h2 id={labelledById} className="text-sm font-semibold tracking-tight text-[var(--p-text-1)]">
            {title}
          </h2>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label={closeLabel}
              className="focus-ring -m-1 shrink-0 rounded p-1 opacity-60 transition-opacity hover:opacity-100"
            >
              <X size={14} aria-hidden />
            </button>
          )}
        </div>
        {body && (
          <div id={describedById} className="mt-1.5 text-xs text-[var(--p-text-2)]">
            {body}
          </div>
        )}
        {footer && <div className="mt-3">{footer}</div>}
      </div>
    );
  },
);

export interface CoachmarkProps {
  target: string | HTMLElement | null;
  title: string;
  body?: React.ReactNode;
  side?: Side;
  open?: boolean;
  onClose?: () => void;
  /** Dim the rest of the page with a spotlight cutout over the target. Default false. */
  spotlight?: boolean;
}

export function Coachmark({ target, title, body, side = "bottom", open = true, onClose, spotlight = false }: CoachmarkProps) {
  const t = useT();
  const [mounted, setMounted] = React.useState(false);
  const rect = useTargetRect(open ? target : null);
  const ids = React.useId();

  React.useEffect(() => setMounted(true), []);

  if (!mounted || !open || !rect) return null;

  return createPortal(
    <>
      {spotlight && <Spotlight rect={rect} onClick={onClose} />}
      <CoachmarkBubble
        title={title}
        body={body}
        side={side}
        onClose={onClose}
        closeLabel={t("ui.coachmark.dismiss", undefined, "Dismiss")}
        labelledById={`${ids}-title`}
        describedById={`${ids}-body`}
        style={bubblePosition(rect, side)}
      />
    </>,
    document.body,
  );
}

// ── Spotlight overlay ────────────────────────────────────────────────────────

function Spotlight({ rect, onClick }: { rect: Rect; onClick?: () => void }) {
  const pad = 6;
  return (
    <div
      aria-hidden
      onClick={onClick}
      className="animate-fade-in fixed inset-0 z-[var(--p-z-tour)]"
      style={{
        // Four panels of scrim around the target leave a clear cutout, so the
        // highlighted element stays fully visible and interactive.
        background: "transparent",
        boxShadow: `0 0 0 9999px color-mix(in oklab, var(--p-text-1) 55%, transparent)`,
        // Use a positioned hole via clip-path on a child instead of layered divs.
      }}
    >
      <div
        className="absolute rounded-[var(--p-r-md)]"
        style={{
          top: rect.top - pad,
          left: rect.left - pad,
          width: rect.width + pad * 2,
          height: rect.height + pad * 2,
          boxShadow: `0 0 0 9999px color-mix(in oklab, var(--p-text-1) 55%, transparent)`,
          transition: "all var(--motion-normal) var(--ease-out)",
        }}
      />
    </div>
  );
}

// ── Tour driver ──────────────────────────────────────────────────────────────

export interface TourStep {
  target: string | HTMLElement;
  title: string;
  body?: React.ReactNode;
  side?: Side;
}

export interface TourProps {
  steps: TourStep[];
  open: boolean;
  /** Called on finish (last → next) or skip. `completed` distinguishes the two. */
  onClose: (completed: boolean) => void;
  /** Controlled step index. Omit for uncontrolled. */
  index?: number;
  onIndexChange?: (index: number) => void;
  spotlight?: boolean;
}

export function Tour({ steps, open, onClose, index, onIndexChange, spotlight = true }: TourProps) {
  const t = useT();
  const [internal, setInternal] = React.useState(0);
  const [mounted, setMounted] = React.useState(false);
  const current = index ?? internal;
  const bubbleRef = React.useRef<HTMLDivElement>(null);
  const ids = React.useId();

  const step = steps[current];
  const rect = useTargetRect(open && step ? step.target : null);

  React.useEffect(() => setMounted(true), []);

  const setIndex = React.useCallback(
    (next: number) => {
      onIndexChange?.(next);
      if (index === undefined) setInternal(next);
    },
    [index, onIndexChange],
  );

  const finish = React.useCallback(
    (completed: boolean) => {
      onClose(completed);
      if (index === undefined) setInternal(0);
    },
    [onClose, index],
  );

  const next = React.useCallback(() => {
    if (current >= steps.length - 1) finish(true);
    else setIndex(current + 1);
  }, [current, steps.length, finish, setIndex]);

  const back = React.useCallback(() => {
    if (current > 0) setIndex(current - 1);
  }, [current, setIndex]);

  // Move focus to the bubble each step + keyboard nav.
  React.useEffect(() => {
    if (!open) return;
    bubbleRef.current?.focus();
  }, [open, current]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        finish(false);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        next();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        back();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, next, back, finish]);

  if (!mounted || !open || !step || !rect) return null;

  const isLast = current >= steps.length - 1;
  const footer = (
    <div className="flex items-center justify-between gap-2">
      <span className="font-mono text-[10px] text-[var(--p-text-3)]" aria-live="polite">
        {t("ui.tour.progress", { current: current + 1, total: steps.length }, "{current} / {total}")}
      </span>
      <div className="flex items-center gap-1.5">
        <Button variant="link" size="sm" onClick={() => finish(false)}>
          {t("ui.tour.skip", undefined, "Skip")}
        </Button>
        {current > 0 && (
          <Button variant="ghost" size="sm" onClick={back}>
            {t("ui.tour.back", undefined, "Back")}
          </Button>
        )}
        <Button variant="primary" size="sm" onClick={next}>
          {isLast ? t("ui.tour.done", undefined, "Done") : t("ui.tour.next", undefined, "Next")}
        </Button>
      </div>
    </div>
  );

  return createPortal(
    <>
      {spotlight && <Spotlight rect={rect} />}
      <CoachmarkBubble
        ref={bubbleRef}
        title={step.title}
        body={step.body}
        side={step.side ?? "bottom"}
        onClose={() => finish(false)}
        closeLabel={t("ui.tour.skip", undefined, "Skip")}
        labelledById={`${ids}-title`}
        describedById={`${ids}-body`}
        footer={footer}
        style={bubblePosition(rect, step.side ?? "bottom")}
      />
    </>,
    document.body,
  );
}
