"use client";

import * as React from "react";
import Link from "next/link";
import { ChartShell } from "@/components/charts/ChartShell";
import { useLocale } from "@/lib/i18n/LocaleProvider";

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
  const { locale, currency } = useLocale();
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
      title="Portfolio Health"
      description="Tile size = budget · color = computed health (schedule + status)"
      empty={enriched.length === 0}
      height={undefined as unknown as number}
      actions={
        <div className="flex items-center gap-3 text-[10px] tracking-[0.16em] text-[var(--text-muted)] uppercase">
          <Legend tone="bg-[var(--color-success)]" label={`On track ${counts.green}`} />
          <Legend tone="bg-[var(--color-caution)]" label={`Watch ${counts.amber}`} />
          <Legend tone="bg-[var(--color-error)]" label={`At risk ${counts.red}`} />
        </div>
      }
    >
      <div className="grid auto-rows-min gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {enriched.map((p) => (
          <Link
            key={p.id}
            href={`/console/projects/${p.id}`}
            className={`hover-lift block rounded-md border border-[var(--border-color)] p-3 ${tone(p.health).bg}`}
            style={{ minHeight: 70 + 60 * p.relSize }}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-[var(--text-primary)]">{p.name}</div>
                <div className="mt-0.5 text-[10px] tracking-[0.16em] text-[var(--text-muted)] uppercase">
                  {p.status}
                </div>
              </div>
              <span className={`mt-0.5 inline-block h-2 w-2 shrink-0 rounded-full ${tone(p.health).dot}`} aria-hidden />
            </div>
            <div className="mt-3 flex items-baseline justify-between text-[11px] text-[var(--text-secondary)]">
              <span className="font-mono">{fmtBudget(p.budgetCents, locale, currency)}</span>
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
      bg: "bg-[color-mix(in_srgb,var(--color-error)_8%,transparent)] hover:bg-[color-mix(in_srgb,var(--color-error)_12%,transparent)]",
      dot: "bg-[var(--color-error)]",
    };
  if (h === "amber")
    return {
      bg: "bg-[color-mix(in_srgb,var(--color-caution)_8%,transparent)] hover:bg-[color-mix(in_srgb,var(--color-caution)_12%,transparent)]",
      dot: "bg-[var(--color-caution)]",
    };
  return {
    bg: "bg-[color-mix(in_srgb,var(--color-success)_8%,transparent)] hover:bg-[color-mix(in_srgb,var(--color-success)_12%,transparent)]",
    dot: "bg-[var(--color-success)]",
  };
}

function fmtBudget(cents: number, locale: string, currency: string): string {
  if (!cents) return "—";
  // Compact notation isn't a first-class option in the shared `formatMoney`
  // helper (it bakes in 2 fraction digits for ledger fidelity); the grid
  // uses the compact notation deliberately to keep cards dense, so we call
  // `Intl.NumberFormat` directly but with the resolved request locale +
  // currency rather than hardcoding `en-US` / `USD`.
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    notation: "compact",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
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
