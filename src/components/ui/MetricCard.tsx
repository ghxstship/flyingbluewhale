"use client";

import * as React from "react";
import { Sparkline } from "@/components/charts/Sparkline";

export function MetricCard({
  label,
  value,
  delta,
  accent,
  icon,
  sparkline,
  loading,
}: {
  label: string;
  value: React.ReactNode;
  delta?: { value: string; positive?: boolean };
  accent?: boolean;
  icon?: React.ReactNode;
  /** Array of numeric points to draw as a trailing sparkline. */
  sparkline?: number[];
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div className="surface p-4" aria-busy="true">
        <div className="flex items-center justify-between">
          <div className="skeleton h-3 w-20 rounded" />
          <div className="skeleton h-4 w-4 rounded" />
        </div>
        <div className="skeleton mt-2 h-7 w-24 rounded" />
        <div className="skeleton mt-2 h-3 w-16 rounded" />
      </div>
    );
  }
  return (
    <div className="surface p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium tracking-wide text-[var(--text-muted)] uppercase">{label}</p>
        {icon}
      </div>
      <div
        className={`mt-2 text-2xl font-semibold tracking-tight ${
          accent ? "text-[var(--org-primary)]" : "text-[var(--foreground)]"
        }`}
        aria-label={typeof value === "string" || typeof value === "number" ? String(value) : undefined}
      >
        {value}
      </div>
      {delta && (
        <div
          className={`mt-1 text-xs font-medium ${delta.positive ? "text-[var(--color-success)]" : "text-[var(--color-error)]"}`}
        >
          <span aria-hidden="true">{delta.positive ? "↑" : "↓"} </span>
          <span className="sr-only">{delta.positive ? "increased" : "decreased"} by </span>
          {delta.value}
        </div>
      )}
      {sparkline && sparkline.length > 1 && (
        <div className="mt-2">
          <Sparkline data={sparkline} />
        </div>
      )}
    </div>
  );
}
