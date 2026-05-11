"use client";

import { useState, useMemo } from "react";
import type { Lead, LeadStage } from "@/lib/supabase/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

type Column = { stage: LeadStage; label: string; color: string };

const COLUMNS: Column[] = [
  { stage: "new", label: "New", color: "var(--text-muted)" },
  { stage: "qualified", label: "Qualified", color: "var(--color-info, #0288d1)" },
  { stage: "contacted", label: "Contacted", color: "var(--color-warning)" },
  { stage: "proposal", label: "Proposal", color: "var(--org-primary)" },
  { stage: "won", label: "Won", color: "var(--color-success)" },
  { stage: "lost", label: "Lost", color: "var(--color-error)" },
];

function cents(n: number) {
  if (n >= 100_000_00) return `$${(n / 100_000_00).toFixed(1)}M`;
  if (n >= 1_000_00) return `$${(n / 1_000_00).toFixed(0)}K`;
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(
    n / 100,
  );
}

function LeadCard({ lead }: { lead: Lead }) {
  return (
    <a
      href={`/console/pipeline/${lead.id}`}
      className="surface-raised block rounded-lg p-3 hover-lift space-y-2 text-left"
    >
      <div className="text-sm font-medium leading-snug">{lead.name}</div>
      {lead.estimated_value_cents != null && (
        <div className="text-xs font-mono tabular-nums text-[var(--text-secondary)]">
          {cents(lead.estimated_value_cents)}
        </div>
      )}
      <div className="flex flex-wrap gap-1">
        {lead.source && (
          <Badge variant="muted" size="sm">
            {lead.source}
          </Badge>
        )}
        {lead.email && (
          <span className="text-[10px] text-[var(--text-muted)] truncate max-w-[120px]">{lead.email}</span>
        )}
      </div>
      <div className="text-[10px] text-[var(--text-muted)]">
        {new Date(lead.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
      </div>
    </a>
  );
}

export function PipelineKanban({ leads }: { leads: Lead[] }) {
  const [filter, setFilter] = useState("");

  const filtered = useMemo(() => {
    const q = filter.toLowerCase();
    return leads.filter(
      (l) =>
        !q ||
        l.name.toLowerCase().includes(q) ||
        (l.email ?? "").toLowerCase().includes(q) ||
        (l.source ?? "").toLowerCase().includes(q),
    );
  }, [leads, filter]);

  const byStage = useMemo(() => {
    const map: Record<LeadStage, Lead[]> = {
      new: [],
      qualified: [],
      contacted: [],
      proposal: [],
      won: [],
      lost: [],
    };
    filtered.forEach((l) => map[l.stage].push(l));
    return map;
  }, [filtered]);

  const totalPipelineValue = useMemo(
    () =>
      leads
        .filter((l) => l.stage !== "lost")
        .reduce((sum, l) => sum + (l.estimated_value_cents ?? 0), 0),
    [leads],
  );

  const wonValue = useMemo(
    () => leads.filter((l) => l.stage === "won").reduce((sum, l) => sum + (l.estimated_value_cents ?? 0), 0),
    [leads],
  );

  return (
    <div className="page-content space-y-4">
      {/* Metrics bar */}
      <div className="metric-grid">
        <div className="surface p-4">
          <div className="text-xs text-[var(--text-muted)]">Pipeline value</div>
          <div className="mt-1 text-xl font-bold tabular-nums">{cents(totalPipelineValue)}</div>
        </div>
        <div className="surface p-4">
          <div className="text-xs text-[var(--text-muted)]">Won</div>
          <div className="mt-1 text-xl font-bold tabular-nums text-[var(--color-success)]">{cents(wonValue)}</div>
        </div>
        <div className="surface p-4">
          <div className="text-xs text-[var(--text-muted)]">Total leads</div>
          <div className="mt-1 text-xl font-bold tabular-nums">{leads.length}</div>
        </div>
        <div className="surface p-4">
          <div className="text-xs text-[var(--text-muted)]">In proposal</div>
          <div className="mt-1 text-xl font-bold tabular-nums">{byStage.proposal.length}</div>
        </div>
      </div>

      {/* Search */}
      <input
        type="search"
        placeholder="Filter leads…"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="input-base w-full max-w-xs text-sm"
      />

      {/* Kanban board */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-3 min-w-max">
          {COLUMNS.map((col) => {
            const colLeads = byStage[col.stage];
            const colValue = colLeads.reduce((s, l) => s + (l.estimated_value_cents ?? 0), 0);
            return (
              <div key={col.stage} className="flex flex-col gap-2 w-56">
                {/* Column header */}
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ background: col.color }}
                      aria-hidden
                    />
                    <span className="text-xs font-semibold">{col.label}</span>
                    <span className="rounded-full bg-[var(--bg-elevated)] px-1.5 py-0.5 text-[10px] text-[var(--text-muted)]">
                      {colLeads.length}
                    </span>
                  </div>
                  {colValue > 0 && (
                    <span className="text-[10px] tabular-nums text-[var(--text-muted)]">{cents(colValue)}</span>
                  )}
                </div>

                {/* Cards */}
                <div className="flex flex-col gap-2 rounded-xl bg-[var(--bg-elevated)] p-2 min-h-24">
                  {colLeads.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center">
                      <span className="text-[10px] text-[var(--text-muted)]">Empty</span>
                    </div>
                  ) : (
                    colLeads.map((l) => <LeadCard key={l.id} lead={l} />)
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
