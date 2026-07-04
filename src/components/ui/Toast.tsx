"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import { useT } from "@/lib/i18n/LocaleProvider";

/**
 * Web toast system.
 *
 * Mount <ToastProvider> near the root, then call `toast()` from `useToast()`
 * anywhere below it. Toasts stack bottom-right in a portal, auto-dismiss after
 * `duration` ms (pausable on hover), and announce through an ARIA live region.
 *
 * Tones map to the semantic tokens (`--p-{success,warning,danger,info}`); the
 * copy reads from the matching AA `-text` ink so small toast text clears 4.5:1.
 */

export type ToastTone = "info" | "success" | "warning" | "danger";

export interface ToastOptions {
  title: string;
  description?: string;
  tone?: ToastTone;
  /** Auto-dismiss delay in ms. Pass 0 to disable auto-dismiss. Default 5000. */
  duration?: number;
}

export interface ToastRecord extends Required<Omit<ToastOptions, "description">> {
  id: string;
  description?: string;
}

export interface ToastContextValue {
  /** Enqueue a toast. Returns its id (use with `dismiss`). */
  toast: (opts: ToastOptions) => string;
  /** Manually dismiss a toast by id. */
  dismiss: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

const TONE_CLASS: Record<ToastTone, { border: string; bg: string; fg: string; Icon: typeof Info }> = {
  info: {
    border: "border-[color:var(--p-info)]/40",
    bg: "bg-[color:var(--p-info)]/10",
    fg: "text-[color:var(--p-info-text)]",
    Icon: Info,
  },
  success: {
    border: "border-[color:var(--p-success)]/40",
    bg: "bg-[color:var(--p-success)]/10",
    fg: "text-[color:var(--p-success-text)]",
    Icon: CheckCircle2,
  },
  warning: {
    border: "border-[color:var(--p-warning)]/40",
    bg: "bg-[color:var(--p-warning)]/10",
    fg: "text-[color:var(--p-warning-text)]",
    Icon: AlertTriangle,
  },
  danger: {
    border: "border-[color:var(--p-danger)]/40",
    bg: "bg-[color:var(--p-danger)]/10",
    fg: "text-[color:var(--p-danger-text)]",
    Icon: AlertCircle,
  },
};

/** Imperative hook — `const { toast } = useToast()`. Throws if no provider. */
export function useToast(): ToastContextValue {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a <ToastProvider>");
  return ctx;
}

export function ToastProvider({
  children,
  duration = 5000,
}: {
  children: React.ReactNode;
  /** Default auto-dismiss delay (ms) for toasts that don't set their own. */
  duration?: number;
}) {
  const t = useT();
  const [toasts, setToasts] = React.useState<ToastRecord[]>([]);
  const [mounted, setMounted] = React.useState(false);
  const timers = React.useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  React.useEffect(() => {
    setMounted(true);
    const map = timers.current;
    return () => {
      map.forEach((tid) => clearTimeout(tid));
      map.clear();
    };
  }, []);

  const dismiss = React.useCallback((id: string) => {
    const tid = timers.current.get(id);
    if (tid) {
      clearTimeout(tid);
      timers.current.delete(id);
    }
    setToasts((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const arm = React.useCallback(
    (id: string, ms: number) => {
      if (ms <= 0) return;
      const tid = setTimeout(() => dismiss(id), ms);
      timers.current.set(id, tid);
    },
    [dismiss],
  );

  const pause = React.useCallback((id: string) => {
    const tid = timers.current.get(id);
    if (tid) {
      clearTimeout(tid);
      timers.current.delete(id);
    }
  }, []);

  const toast = React.useCallback(
    (opts: ToastOptions) => {
      const id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const record: ToastRecord = {
        id,
        title: opts.title,
        description: opts.description,
        tone: opts.tone ?? "info",
        duration: opts.duration ?? duration,
      };
      setToasts((prev) => [...prev, record]);
      arm(id, record.duration);
      return id;
    },
    [arm, duration],
  );

  const ctx = React.useMemo<ToastContextValue>(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      {mounted &&
        createPortal(
          <div
            // Polite live region: queued toasts are announced without interrupting.
            role="region"
            aria-label={t("ui.toast.region", undefined, "Notifications")}
            className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-end gap-2 p-4 sm:end-0 sm:start-auto"
          >
            <div aria-live="polite" aria-atomic="false" className="flex w-full flex-col items-end gap-2">
              {toasts.map((x) => {
                const { border, bg, fg, Icon } = TONE_CLASS[x.tone];
                return (
                  // False positive: the element HAS a role (alert/status below) —
                  // the linter just can't resolve the conditional expression. The
                  // hover/focus handlers only pause the auto-dismiss timer.
                  // eslint-disable-next-line jsx-a11y/no-static-element-interactions
                  <div
                    key={x.id}
                    role={x.tone === "danger" ? "alert" : "status"}
                    onMouseEnter={() => pause(x.id)}
                    onMouseLeave={() => arm(x.id, x.duration)}
                    onFocus={() => pause(x.id)}
                    onBlur={() => arm(x.id, x.duration)}
                    className={`surface-raised pointer-events-auto animate-slide-up flex w-full max-w-sm items-start gap-2 rounded-[var(--p-r-md)] border ${border} ${bg} p-3 text-xs ${fg}`}
                  >
                    <Icon size={16} className="mt-0.5 shrink-0" aria-hidden />
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold">{x.title}</div>
                      {x.description && <div className="mt-1 text-[var(--p-text-2)]">{x.description}</div>}
                    </div>
                    <button
                      type="button"
                      onClick={() => dismiss(x.id)}
                      aria-label={t("ui.toast.dismiss", undefined, "Dismiss notification")}
                      className="focus-ring -m-1 shrink-0 rounded p-1 opacity-60 transition-opacity hover:opacity-100"
                    >
                      <X size={14} aria-hidden />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>,
          document.body,
        )}
    </ToastContext.Provider>
  );
}
