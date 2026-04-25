"use client";

import * as React from "react";
import Link from "next/link";
import { ChartShell } from "@/components/charts/ChartShell";

export type PortfolioEntry = {
  id: string;
  name: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  budgetCents: number;
};

/**
 * Project portfolio heatmap. Each project is a tile sized by budget and
 * tinted by computed health (status + schedule pressure). Clicking opens
 * the project detail. Sorted by health-then-budget so the riskiest big
 * projects rise to the top — the view an exec wants.
 */
export function ProjectPortfolioGrid({ entries }: { entries: PortfolioEntry[] }) {
  if (entries.length === 0) return null;

  const max = Math.max(1, ...entries.map((e) => e.budgetCents));
  const enriched = entries.map((e) => ({
    ...e,
    health: computeHealth(e),
    relSize: Math.max(0.32, e.budgetCents / max),
  }));
  enriched.sort((a, b) => {
    const order = { red: 0, amber: 1, green: 2 } as const;
    if (a.health !== b.health) return order[a.health] - order[b.health];
    return b.budgetCents - a.budgetCents;
  });

  const counts = {
    green: enriched.filter((e) => e.health === "green").length,
    amber: enriched.filter((e) => e.health === "amber").length,
    red: enriched.filter((e) => e.health === "red").length,
  };

  return (
    <ChartShell
      title="Portfolio health"
      description="Tile size = budget · color = computed health (schedule + status)"
      empty={enriched.length === 0}
      height={undefined as unknown as number}
      actions={
        <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
          <Legend tone="bg-emerald-500" label={`On track ${counts.green}`} />
          <Legend tone="bg-amber-500" label={`Watch ${counts.amber}`} />
          <Legend tone="bg-red-600" label={`At risk ${counts.red}`} />
        </div>
      }
    >
      <div className="grid auto-rows-min gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {enriched.map((p) => (
          <Link
            key={p.id}
            href={`/console/projects/${p.id}`}
            className={`block rounded-md border border-[var(--border-color)] p-3 transition-shadow hover:shadow-md ${tone(p.health).bg}`}
            style={{ minHeight: 70 + 60 * p.relSize }}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-[var(--text-primary)]">{p.name}</div>
                <div className="mt-0.5 text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                  {p.status}
                </div>
              </div>
              <span className={`mt-0.5 inline-block h-2 w-2 shrink-0 rounded-full ${tone(p.health).dot}`} aria-hidden />
            </div>
            <div className="mt-3 flex items-baseline justify-between text-[11px] text-[var(--text-secondary)]">
              <span className="font-mono">{fmtBudget(p.budgetCents)}</span>
              <span className="text-[var(--text-muted)]">{scheduleLabel(p)}</span>
            </div>
          </Link>
        ))}
      </div>
    </ChartShell>
  );
}

type Health = "green" | "amber" | "red";

function computeHealth(p: PortfolioEntry): Health {
  if (p.status === "on_hold" || p.status === "cancelled") return "red";
  if (p.status === "completed") return "green";
  // Schedule pressure: how close to / past end date relative to span.
  if (!p.endDate) return "green";
  const end = new Date(p.endDate).getTime();
  const start = p.startDate ? new Date(p.startDate).getTime() : end - 30 * 86400000;
  const span = Math.max(end - start, 1);
  const elapsed = Date.now() - start;
  const pct = elapsed / span;
  if (pct > 1) return "red"; // past end date but still active
  if (pct > 0.85) return "amber";
  return "green";
}

function tone(h: Health): { bg: string; dot: string } {
  if (h === "red")
    return {
      bg: "bg-[color:var(--color-error)]/8 hover:bg-[color:var(--color-error)]/12",
      dot: "bg-red-500",
    };
  if (h === "amber")
    return {
      bg: "bg-amber-500/8 hover:bg-amber-500/12",
      dot: "bg-amber-500",
    };
  return {
    bg: "bg-emerald-500/8 hover:bg-emerald-500/12",
    dot: "bg-emerald-500",
  };
}

function fmtBudget(cents: number): string {
  if (!cents) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(cents / 100);
}

function scheduleLabel(p: PortfolioEntry): string {
  if (!p.endDate) return "no end";
  const days = Math.round((new Date(p.endDate).getTime() - Date.now()) / 86400000);
  if (days < 0) return `${-days}d over`;
  if (days === 0) return "ends today";
  return `${days}d left`;
}

function Legend({ tone, label }: { tone: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className={`inline-block h-2 w-3 rounded-sm ${tone}`} aria-hidden />
      {label}
    </span>
  );
}
