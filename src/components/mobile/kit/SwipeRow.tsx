"use client";

import { useRef, useState, type PointerEvent, type ReactNode } from "react";
import { KIcon } from "./icon";

/**
 * Swipe-to-reveal row actions (iOS/Gmail pattern). Ported from the
 * prototype `SwipeRow` — pointer + touch drag with a tap-to-toggle handle
 * for desktop/a11y. Tapping the closed face fires `onClick`.
 */
export type SwipeTone = "warn" | "danger" | "info" | "neutral" | "ok";

export const SW_TONE: Record<SwipeTone, string> = {
  warn: "var(--p-warning)",
  danger: "var(--p-danger)",
  info: "var(--p-info)",
  neutral: "var(--p-text-3)",
  ok: "var(--p-success)",
};

export type SwipeAction = {
  icon: string;
  label: string;
  tone?: SwipeTone;
  on?: () => void;
};

export type SwipeRowProps = {
  actions?: SwipeAction[];
  onClick?: () => void;
  children?: ReactNode;
};

type DragState = { x: number | null; base: number; moved: boolean };

export function SwipeRow({ actions = [], onClick, children }: SwipeRowProps) {
  const [dx, setDx] = useState(0);
  const [open, setOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const drag = useRef<DragState | null>(null);
  const W = Math.min(actions.length * 74, 230);
  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    drag.current = { x: e.clientX, base: open ? -W : 0, moved: false };
    setDragging(true);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* no-op */
    }
  };
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!drag.current || drag.current.x == null) return;
    const d = e.clientX - drag.current.x;
    if (Math.abs(d) > 3) drag.current.moved = true;
    setDx(Math.max(-W, Math.min(0, drag.current.base + d)));
  };
  const onUp = () => {
    if (!drag.current) return;
    const o = dx < -W * 0.4;
    setOpen(o);
    setDx(o ? -W : 0);
    drag.current = { ...drag.current, x: null };
    setDragging(false);
    setTimeout(() => {
      drag.current = null;
    }, 0);
  };
  const tx = dragging ? dx : open ? -W : 0;
  const close = () => {
    setOpen(false);
    setDx(0);
  };
  return (
    <div className="swipe">
      <div className="swipe-actions" style={{ width: W }}>
        {actions.map((a, i) => (
          <button
            key={i}
            type="button"
            className="swa"
            style={{ background: SW_TONE[a.tone ?? "neutral"] }}
            onClick={() => {
              close();
              a.on?.();
            }}
          >
            <KIcon name={a.icon} size={17} />
            <span>{a.label}</span>
          </button>
        ))}
      </div>
      <div
        className="swipe-face"
        style={{ transform: `translateX(${tx}px)` }}
        role="button"
        tabIndex={0}
        aria-label={actions.length ? "Row · press to reveal actions" : "Open"}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (open) {
              close();
            } else if (actions.length) {
              setOpen(true);
              setDx(-W);
            } else {
              onClick?.();
            }
          } else if (e.key === "Escape" && open) {
            close();
          }
        }}
        onClick={() => {
          if (open) {
            close();
            return;
          }
          if (!(drag.current && drag.current.moved)) onClick?.();
        }}
      >
        {children}
      </div>
    </div>
  );
}
