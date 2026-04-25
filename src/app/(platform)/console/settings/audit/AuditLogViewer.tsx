"use client";

import * as React from "react";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { DiffViewer } from "@/components/charts/DiffViewer";
import { timeAgo } from "@/lib/format";
import type { AuditLog } from "@/lib/supabase/types";

/**
 * Audit log viewer with click-to-expand diff per row + actor / action /
 * target-table filters. Modeled on Notion's audit panel and GitHub's
 * commit page. Each row's `metadata` is treated as `{ before, after }`
 * when both fields are present; otherwise we render whatever shape exists.
 */
export function AuditLogViewer({ rows }: { rows: AuditLog[] }) {
  const [actorFilter, setActorFilter] = React.useState("");
  const [actionFilter, setActionFilter] = React.useState("");
  const [tableFilter, setTableFilter] = React.useState("");
  const [open, setOpen] = React.useState<string | null>(null);

  const actions = React.useMemo(
    () => Array.from(new Set(rows.map((r) => r.action))).sort(),
    [rows],
  );
  const tables = React.useMemo(
    () =>
      Array.from(new Set(rows.map((r) => r.target_table).filter(Boolean) as string[])).sort(),
    [rows],
  );

  const filtered = rows.filter((r) => {
    if (actorFilter) {
      const a = r.actor_id?.toLowerCase() ?? "";
      if (!a.includes(actorFilter.toLowerCase())) return false;
    }
    if (actionFilter && r.action !== actionFilter) return false;
    if (tableFilter && r.target_table !== tableFilter) return false;
    return true;
  });

  return (
    <section className="surface">
      <div className="flex flex-wrap items-end gap-2 border-b border-[var(--border-color)] px-4 py-3">
        <div className="min-w-[180px] flex-1">
          <Input
            label="Actor (UUID prefix)"
            value={actorFilter}
            onChange={(e) => setActorFilter(e.target.value)}
            placeholder="af75a33d…"
            clearable
            onClear={() => setActorFilter("")}
          />
        </div>
        <div className="min-w-[160px]">
          <label className="text-xs font-medium text-[var(--text-secondary)]">Action</label>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="input-base mt-1.5 w-full"
          >
            <option value="">All actions</option>
            {actions.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-[160px]">
          <label className="text-xs font-medium text-[var(--text-secondary)]">Target table</label>
          <select
            value={tableFilter}
            onChange={(e) => setTableFilter(e.target.value)}
            className="input-base mt-1.5 w-full"
          >
            <option value="">All tables</option>
            {tables.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <span className="text-xs text-[var(--text-muted)]">
          {filtered.length} / {rows.length} events
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="data-table w-full text-sm">
          <thead>
            <tr>
              <th className="w-8" />
              <th>When</th>
              <th>Action</th>
              <th>Target</th>
              <th>Actor</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-6 text-center text-[var(--text-muted)]">
                  No matching events.
                </td>
              </tr>
            ) : (
              filtered.map((r) => {
                const isOpen = open === r.id;
                const diffable = isDiffable(r.metadata);
                return (
                  <React.Fragment key={r.id}>
                    <tr
                      className={`cursor-pointer ${isOpen ? "bg-[var(--surface-inset)]" : ""}`}
                      onClick={() => setOpen(isOpen ? null : r.id)}
                    >
                      <td className="text-center text-[var(--text-muted)]">
                        {diffable ? (isOpen ? "▾" : "▸") : ""}
                      </td>
                      <td className="font-mono text-xs">{timeAgo(r.at)}</td>
                      <td>
                        <Badge variant="muted">
                          <span className="font-mono">{r.action}</span>
                        </Badge>
                      </td>
                      <td className="font-mono text-xs">
                        {r.target_table ?? "—"}
                        {r.target_id ? `:${r.target_id.slice(0, 8)}` : ""}
                      </td>
                      <td className="font-mono text-xs">
                        {r.actor_id ? r.actor_id.slice(0, 8) : "system"}
                      </td>
                    </tr>
                    {isOpen && (
                      <tr>
                        <td colSpan={5} className="bg-[var(--surface-inset)]/40 px-4 py-3">
                          {diffable ? (
                            <DiffViewer
                              before={(r.metadata as { before?: unknown }).before}
                              after={(r.metadata as { after?: unknown }).after}
                            />
                          ) : (
                            <pre className="overflow-x-auto rounded bg-[var(--surface-raised)] p-2 font-mono text-[10px] text-[var(--text-secondary)]">
                              {JSON.stringify(r.metadata ?? {}, null, 2)}
                            </pre>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function isDiffable(meta: unknown): meta is { before: unknown; after: unknown } {
  if (!meta || typeof meta !== "object") return false;
  const m = meta as Record<string, unknown>;
  return "before" in m && "after" in m;
}
