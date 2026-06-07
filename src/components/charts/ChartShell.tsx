"use client";

import * as React from "react";
import { AlertTriangle, BarChart3 } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";

/**
 * ChartShell — wraps any visualization with built-in loading / empty /
 * error states + a consistent header + actions slot. Every recharts /
 * maplibre / custom-svg view consumes this so operators get the same
 * affordances across the product (Linear / Stripe / Ramp pattern).
 *
 *   <ChartShell title="Monthly revenue" loading={pending} error={err}>
 *     <ResponsiveContainer ...>...</ResponsiveContainer>
 *   </ChartShell>
 */
export function ChartShell({
  title,
  description,
  actions,
  loading,
  error,
  empty,
  emptyLabel = "No data yet",
  height = 280,
  className = "",
  children,
}: {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  loading?: boolean;
  error?: Error | string | null;
  empty?: boolean;
  emptyLabel?: string;
  height?: number;
  className?: string;
  children: React.ReactNode;
}) {
  const errorMsg = error instanceof Error ? error.message : error || null;
  return (
    <section className={`surface flex flex-col ${className}`} aria-busy={loading || undefined}>
      {(title || actions) && (
        // flex-wrap so a wide actions slot (e.g. the Portfolio Health legend
        // with 3 ON-TRACK / WATCH / AT-RISK items) drops onto its own row at
        // narrow viewports rather than squeezing the title side to 0 width
        // and letter-stacking the heading vertically. flex-1 + min-w-0 on
        // the title side lets it claim available space and ellipsis-truncate
        // long titles cleanly.
        <header className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1 border-b border-[var(--p-border)] px-4 py-2.5">
          <div className="min-w-0 flex-1">
            {title && <h3 className="text-sm font-semibold text-[var(--p-text-1)]">{title}</h3>}
            {description && <p className="mt-0.5 text-xs text-[var(--p-text-2)]">{description}</p>}
          </div>
          {actions && <div className="shrink-0">{actions}</div>}
        </header>
      )}
      <div className="relative w-full p-3" style={{ minHeight: height }}>
        {loading ? (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-xs text-[var(--p-text-2)]"
            role="status"
          >
            <Spinner size="lg" />
            Loading…
          </div>
        ) : errorMsg ? (
          <div
            role="alert"
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center text-xs text-[var(--p-danger)]"
          >
            <AlertTriangle size={18} aria-hidden />
            <div className="font-medium">Could not load data</div>
            <div className="max-w-sm text-[var(--p-text-2)]">{errorMsg}</div>
          </div>
        ) : empty ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-xs text-[var(--p-text-2)]">
            <BarChart3 size={20} aria-hidden />
            {emptyLabel}
          </div>
        ) : (
          children
        )}
      </div>
    </section>
  );
}
