"use client";

import type { ReactNode } from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import { useT } from "@/lib/i18n/LocaleProvider";

/**
 * Inline message block — replaces the hand-rolled
 * `rounded-lg border border-[var(--p-danger)]/40 bg-[var(--p-danger)]/10 …`
 * pattern that had propagated across form error surfaces, API response
 * boxes, and permission-denied callouts.
 *
 * Kinds map to semantic tokens (`--p-danger/warning/info/success`)
 * so every theme paints the same severity consistently.
 */

export type AlertKind = "error" | "warning" | "info" | "success";

const KIND_CLASS: Record<AlertKind, { border: string; bg: string; fg: string; Icon: typeof AlertCircle }> = {
  error: {
    border: "border-[color:var(--p-danger)]/40",
    bg: "bg-[color:var(--p-danger)]/10",
    fg: "text-[color:var(--p-danger)]",
    Icon: AlertCircle,
  },
  warning: {
    border: "border-[color:var(--p-warning)]/40",
    bg: "bg-[color:var(--p-warning)]/10",
    fg: "text-[color:var(--p-warning)]",
    Icon: AlertTriangle,
  },
  info: {
    border: "border-[color:var(--p-info)]/40",
    bg: "bg-[color:var(--p-info)]/10",
    fg: "text-[color:var(--p-info)]",
    Icon: Info,
  },
  success: {
    border: "border-[color:var(--p-success)]/40",
    bg: "bg-[color:var(--p-success)]/10",
    fg: "text-[color:var(--p-success)]",
    Icon: CheckCircle2,
  },
};

export function Alert({
  kind = "info",
  title,
  children,
  className = "",
  hideIcon = false,
  onClose,
  action,
}: {
  kind?: AlertKind;
  title?: string;
  children?: ReactNode;
  className?: string;
  hideIcon?: boolean;
  /** Show a close (X) button. Caller controls dismissal state. */
  onClose?: () => void;
  /** Optional CTA button slot (label + onClick). */
  action?: { label: string; onClick: () => void };
}) {
  const t = useT();
  const { border, bg, fg, Icon } = KIND_CLASS[kind];
  return (
    <div
      role={kind === "error" ? "alert" : "status"}
      className={`flex items-start gap-2 rounded-lg border ${border} ${bg} p-2.5 text-xs ${fg} animate-fade-in ${className}`.trim()}
    >
      {!hideIcon && <Icon size={14} className="mt-0.5 shrink-0" aria-hidden />}
      <div className="min-w-0 flex-1">
        {title && <div className="font-semibold">{title}</div>}
        {children && <div className={title ? "mt-1" : ""}>{children}</div>}
        {action && (
          <button
            type="button"
            onClick={action.onClick}
            className={`mt-1 inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium underline-offset-2 hover:underline`}
          >
            {action.label}
          </button>
        )}
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label={t("ui.alert.dismiss", undefined, "Dismiss")}
          className="-m-1 shrink-0 rounded p-1 opacity-60 hover:opacity-100"
        >
          <X size={12} aria-hidden />
        </button>
      )}
    </div>
  );
}
