"use client";

import * as React from "react";
import Link from "next/link";
import { ChartShell } from "@/components/charts/ChartShell";
import type { RiskLikelihood, RiskImpact, RiskStatus } from "@/lib/supabase/types";

export type RiskCell = {
  impact: RiskImpact;
  likelihood: RiskLikelihood;
  impactIndex: number; // 0 (insignificant) → 4 (severe)
  likelihoodIndex: number; // 0 (rare) → 4 (almost_certain)
  risks: { id: string; title: string; score: number; status: RiskStatus }[];
};

/**
 * 5×5 risk heatmap. Cell color = composite (impactIdx+likelihoodIdx) so the
 * "always green / always red" corners are unambiguous; rows reverse so
 * Severe is at the top (matches every published heatmap convention).
 */
export function RiskHeatmap({
  cells,
  likelihood,
  impact,
}: {
  cells: RiskCell[];
  likelihood: RiskLikelihood[];
  impact: RiskImpact[];
}) {
  const total = cells.reduce((s, c) => s + c.risks.length, 0);
  const [open, setOpen] = React.useState<RiskCell | null>(null);

  return (
    <ChartShell
      title="Risk Heatmap"
      description="Likelihood × Impact (count = severity bubble; click a cell for the list)"
      empty={total === 0}
      emptyLabel="No risks logged yet."
      height={400}
    >
      <div className="flex w-full flex-col">
        <div
          role="grid"
          aria-label="Risk heatmap"
          className="grid"
          style={{
            gridTemplateColumns: `64px repeat(${likelihood.length}, minmax(0, 1fr))`,
          }}
        >
          {/* Top-left empty corner */}
          <div />
          {/* Likelihood headers */}
          {likelihood.map((l) => (
            <div
              key={l}
              className="px-1.5 py-1 text-center text-[10px] font-medium tracking-[0.16em] text-[var(--text-muted)] uppercase"
            >
              {pretty(l)}
            </div>
          ))}

          {/* Body — impact rows reversed (severe at top) */}
          {[...impact].reverse().map((impactRow) => (
            <React.Fragment key={impactRow}>
              <div className="flex items-center justify-end pe-2 text-[10px] font-medium tracking-[0.16em] text-[var(--text-muted)] uppercase">
                {pretty(impactRow)}
              </div>
              {likelihood.map((likeCol) => {
                const cell = cells.find((c) => c.impact === impactRow && c.likelihood === likeCol)!;
                const tone = riskTone(cell.likelihoodIndex, cell.impactIndex);
                return (
                  <button
                    key={`${impactRow}-${likeCol}`}
                    type="button"
                    role="gridcell"
                    aria-label={`${pretty(likeCol)} likelihood, ${pretty(impactRow)} impact: ${cell.risks.length} risks`}
                    onClick={() => cell.risks.length > 0 && setOpen(cell)}
                    className={`hover-lift relative m-0.5 flex aspect-square min-h-[56px] items-center justify-center rounded ${tone}`}
                  >
                    {cell.risks.length > 0 && (
                      <span className="text-[11px] font-semibold text-white tabular-nums drop-shadow" aria-hidden>
                        {cell.risks.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </React.Fragment>
          ))}
        </div>

        <div className="mt-3 flex items-center justify-end gap-3 text-[10px] tracking-[0.16em] text-[var(--text-muted)] uppercase">
          <Legend tone="bg-[var(--color-success)]" label="Low" />
          <Legend tone="bg-[var(--color-caution)]" label="Moderate" />
          <Legend tone="bg-[var(--color-warning)]" label="High" />
          <Legend tone="bg-[var(--color-error)]" label="Severe" />
        </div>

        {open && (
          <div
            className="mt-4 rounded-md border border-[var(--border-color)] bg-[var(--surface-inset)] p-3"
            aria-live="polite"
          >
            <div className="mb-2 flex items-center justify-between">
              <h4 className="text-xs font-semibold tracking-[0.16em] text-[var(--text-muted)] uppercase">
                {pretty(open.likelihood)} × {pretty(open.impact)} — {open.risks.length} risk
                {open.risks.length === 1 ? "" : "s"}
              </h4>
              <button
                type="button"
                onClick={() => setOpen(null)}
                className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                Close
              </button>
            </div>
            <ul className="space-y-1">
              {open.risks.map((r) => (
                <li key={r.id} className="flex items-center justify-between text-xs">
                  <Link
                    href={`/console/programs/risk/${r.id}`}
                    className="truncate text-[var(--text-primary)] hover:underline"
                  >
                    {r.title}
                  </Link>
                  <span className="ms-2 shrink-0 font-mono text-[var(--text-muted)]">
                    {r.status} · score {r.score}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </ChartShell>
  );
}

function Legend({ tone, label }: { tone: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className={`inline-block h-2 w-3 rounded-sm ${tone}`} aria-hidden />
      {label}
    </span>
  );
}

function pretty(s: string) {
  return s.replace(/_/g, " ");
}

/**
 * Composite risk tone: 0–8 → green, yellow, orange, red. Matches the
 * standard 5×5 heat map gradient used by ISO 31000-style registers.
 */
function riskTone(likelihoodIdx: number, impactIdx: number): string {
  const sum = likelihoodIdx + impactIdx; // 0..8
  if (sum <= 2) return "bg-[color-mix(in_srgb,var(--color-success)_85%,transparent)] hover:bg-[var(--color-success)]";
  if (sum <= 4) return "bg-[color-mix(in_srgb,var(--color-caution)_85%,transparent)] hover:bg-[var(--color-caution)]";
  if (sum <= 6) return "bg-[color-mix(in_srgb,var(--color-warning)_85%,transparent)] hover:bg-[var(--color-warning)]";
  return "bg-[color-mix(in_srgb,var(--color-error)_90%,transparent)] hover:bg-[var(--color-error)]";
}
