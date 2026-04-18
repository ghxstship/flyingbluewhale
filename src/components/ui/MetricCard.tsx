"use client";

import * as React from "react";

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
      <div className="surface-raised p-4" aria-busy="true">
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
    <div className="surface-raised p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">{label}</span>
        {icon}
      </div>
      <div
        className={`mt-2 text-2xl font-semibold tracking-tight ${
          accent ? "text-[var(--org-primary)]" : "text-[var(--foreground)]"
        }`}
      >
        {value}
      </div>
      {delta && (
        <div
          className={`mt-1 text-xs font-medium ${
            delta.positive ? "text-emerald-600" : "text-[var(--color-error)]"
          }`}
        >
          <span aria-hidden="true">{delta.positive ? "↑" : "↓"} </span>
          <span className="sr-only">{delta.positive ? "increased" : "decreased"} by </span>
          {delta.value}
        </div>
      )}
      {sparkline && sparkline.length > 1 && <Sparkline data={sparkline} />}
    </div>
  );
}

function Sparkline({ data, width = 120, height = 32 }: { data: number[]; width?: number; height?: number }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const step = width / Math.max(1, data.length - 1);
  const points = data.map((v, i) => ({
    x: i * step,
    y: height - ((v - min) / span) * height,
  }));
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const fill = `${path} L${width},${height} L0,${height} Z`;

  return (
    <svg
      aria-hidden="true"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="mt-2 overflow-visible"
    >
      <path d={fill} fill="var(--org-primary)" fillOpacity="0.12" />
      <path d={path} stroke="var(--org-primary)" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
