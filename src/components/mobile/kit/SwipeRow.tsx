"use client";

import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";
import { actionHaptic, haptic } from "@/lib/haptics";
import { KIcon } from "./icon";
import { Sheet } from "./Sheet";

/**
 * Swipe-to-reveal row actions (iOS/Gmail pattern). Ported from the
 * prototype `SwipeRow` — pointer + touch drag with a tap-to-toggle handle
 * for desktop/a11y. Tapping the closed face fires `onClick`.
 *
 * Kit 32 enrichment wave 2:
 *  - B3 · long-press (or right-click / ContextMenu key) opens an ACTION
 *    drawer mirroring the SAME actions — discoverability + a11y for the
 *    hidden swipe zone. One implementation here covers every SwipeRow list.
 *  - B4 · every action fires a tone-mapped haptic (`actionHaptic`), gated on
 *    the /m/settings Haptics toggle.
 *  - A6 · actions may carry an `href` (tel:/mailto:/https) and render as real
 *    anchors so devices dial/compose natively.
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
  /** Real intent target (tel:/mailto:/https) — renders as an anchor. */
  href?: string;
  on?: () => void;
};

export type SwipeRowProps = {
  actions?: SwipeAction[];
  onClick?: () => void;
  /** Already-translated title for the long-press action drawer. */
  menuTitle?: string;
  children?: ReactNode;
};

type DragState = { x: number | null; y: number; base: number; moved: boolean };

const LONG_PRESS_MS = 500;
const LONG_PRESS_SLOP = 10;

export function SwipeRow({ actions = [], onClick, menuTitle, children }: SwipeRowProps) {
  const [dx, setDx] = useState(0);
  const [open, setOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [menu, setMenu] = useState(false);
  const drag = useRef<DragState | null>(null);
  const lpTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lpFired = useRef(false);
  const W = Math.min(actions.length * 74, 230);

  const clearLp = () => {
    if (lpTimer.current) {
      clearTimeout(lpTimer.current);
      lpTimer.current = null;
    }
  };
  useEffect(() => clearLp, []);

  const openMenu = () => {
    clearLp();
    drag.current = null;
    setDragging(false);
    setDx(0);
    setOpen(false);
    haptic("tap");
    setMenu(true);
  };

  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    drag.current = { x: e.clientX, y: e.clientY, base: open ? -W : 0, moved: false };
    setDragging(true);
    lpFired.current = false;
    if (actions.length && !open) {
      clearLp();
      lpTimer.current = setTimeout(() => {
        lpFired.current = true;
        openMenu();
      }, LONG_PRESS_MS);
    }
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
    if (Math.abs(d) > LONG_PRESS_SLOP || Math.abs(e.clientY - drag.current.y) > LONG_PRESS_SLOP) clearLp();
    setDx(Math.max(-W, Math.min(0, drag.current.base + d)));
  };
  const onUp = () => {
    clearLp();
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
  const fire = (a: SwipeAction) => {
    actionHaptic(a.tone ?? "neutral");
    a.on?.();
  };
  return (
    <div className="swipe">
      <div className="swipe-actions" style={{ width: W }}>
        {actions.map((a, i) =>
          a.href ? (
            <a
              key={i}
              className="swa"
              href={a.href}
              style={{ background: SW_TONE[a.tone ?? "neutral"] }}
              onClick={() => {
                close();
                fire(a);
              }}
            >
              <KIcon name={a.icon} size={17} />
              <span>{a.label}</span>
            </a>
          ) : (
            <button
              key={i}
              type="button"
              className="swa"
              style={{ background: SW_TONE[a.tone ?? "neutral"] }}
              onClick={() => {
                close();
                fire(a);
              }}
            >
              <KIcon name={a.icon} size={17} />
              <span>{a.label}</span>
            </button>
          ),
        )}
      </div>
      <div
        className="swipe-face"
        style={{ transform: `translateX(${tx}px)` }}
        /* No aria-label here: on role="button" a label REPLACES the content
           for AT, so every row used to read as the same generic string instead
           of its own text. The row content is the accessible name; Enter/Space
           and long-press/ContextMenu stay the non-swipe action paths. */
        role="button"
        tabIndex={0}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onContextMenu={(e) => {
          if (!actions.length) return;
          e.preventDefault();
          if (!menu) openMenu();
        }}
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
          } else if (e.key === "ContextMenu" && actions.length) {
            e.preventDefault();
            openMenu();
          } else if (e.key === "Escape" && open) {
            close();
          }
        }}
        onClick={() => {
          if (lpFired.current) {
            lpFired.current = false;
            return;
          }
          if (open) {
            close();
            return;
          }
          if (!(drag.current && drag.current.moved)) onClick?.();
        }}
      >
        {children}
      </div>
      {menu && (
        <Sheet icon="EllipsisVertical" title={menuTitle ?? "Actions"} onClose={() => setMenu(false)}>
          {actions.map((a, i) => {
            const inner = (
              <>
                <KIcon name={a.icon} size={18} style={{ color: SW_TONE[a.tone ?? "neutral"], flex: "none" }} />
                <div className="t">{a.label}</div>
              </>
            );
            return a.href ? (
              <a
                key={i}
                className="item tap"
                href={a.href}
                style={{ cursor: "pointer", textDecoration: "none" }}
                onClick={() => {
                  setMenu(false);
                  fire(a);
                }}
              >
                {inner}
              </a>
            ) : (
              <button
                key={i}
                type="button"
                className="item tap"
                style={{ cursor: "pointer", width: "100%", textAlign: "left" }}
                onClick={() => {
                  setMenu(false);
                  fire(a);
                }}
              >
                {inner}
              </button>
            );
          })}
        </Sheet>
      )}
    </div>
  );
}
