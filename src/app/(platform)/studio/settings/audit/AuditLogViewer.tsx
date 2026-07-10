"use client";

import * as React from "react";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { DiffViewer } from "@/components/charts/DiffViewer";
import { createClient } from "@/lib/supabase/client";
import { useT } from "@/lib/i18n/LocaleProvider";
import { timeAgo } from "@/lib/format";
import type { AuditLog } from "@/lib/supabase/types";

/**
 * Audit log viewer with click-to-expand diff per row + actor / action /
 * target-table filters. Modeled on Notion's audit panel and GitHub's
 * commit page. Each row's `metadata` is treated as `{ before, after }`
 * when both fields are present; otherwise we render whatever shape exists.
 *
 * Live prepend (kit 21 remediation R1, ADR-0015): on the first page the
 * viewer subscribes to `audit_log` INSERTs for the org and prepends them —
 * the audit_log IS the SSOT that `emitAudit` already writes, so "live" is a
 * realtime read over it, not a parallel session-event store.
 */
export function AuditLogViewer({
  rows: initialRows,
  orgId,
  live = false,
}: {
  rows: AuditLog[];
  orgId?: string;
  /** Enable the realtime prepend — only on the first page (offset 0), so a
   *  paginated "older" view isn't confusingly reordered by fresh events. */
  live?: boolean;
}) {
  const t = useT();
  const [actorFilter, setActorFilter] = React.useState("");
  const [actionFilter, setActionFilter] = React.useState("");
  const [tableFilter, setTableFilter] = React.useState("");
  const [open, setOpen] = React.useState<string | null>(null);
  const [liveRows, setLiveRows] = React.useState<AuditLog[]>([]);

  React.useEffect(() => {
    if (!live || !orgId) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`audit-log-${orgId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "audit_log", filter: `org_id=eq.${orgId}` },
        (payload) => {
          const row = payload.new as AuditLog;
          setLiveRows((cur) => (cur.some((r) => r.id === row.id) ? cur : [row, ...cur]));
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [live, orgId]);

  // Session-fresh events (newest first) above the server page, deduped against
  // the initial rows so a refresh doesn't double them.
  const initialIds = React.useMemo(() => new Set(initialRows.map((r) => r.id)), [initialRows]);
  const rows = React.useMemo(
    () => [...liveRows.filter((r) => !initialIds.has(r.id)), ...initialRows],
    [liveRows, initialRows, initialIds],
  );

  const actions = React.useMemo(() => Array.from(new Set(rows.map((r) => r.action))).sort(), [rows]);
  const tables = React.useMemo(
    () => Array.from(new Set(rows.map((r) => r.target_table).filter(Boolean) as string[])).sort(),
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
      <div className="flex flex-wrap items-end gap-2 border-b border-[var(--p-border)] px-4 py-3">
        <div className="min-w-[180px] flex-1">
          <Input
            label={t("console.settings.audit.actorLabel", undefined, "Actor (UUID Prefix)")}
            value={actorFilter}
            onChange={(e) => setActorFilter(e.target.value)}
            placeholder="af75a33d…"
            clearable
            onClear={() => setActorFilter("")}
          />
        </div>
        <div className="min-w-[160px]">
          <label className="text-xs font-medium text-[var(--p-text-2)]">
            {t("console.settings.audit.actionLabel", undefined, "Action")}
          </label>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="ps-input mt-1.5 w-full"
          >
            <option value="">{t("console.settings.audit.allActions", undefined, "All actions")}</option>
            {actions.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-[160px]">
          <label className="text-xs font-medium text-[var(--p-text-2)]">
            {t("console.settings.audit.targetTableLabel", undefined, "Target Table")}
          </label>
          <select
            value={tableFilter}
            onChange={(e) => setTableFilter(e.target.value)}
            className="ps-input mt-1.5 w-full"
          >
            <option value="">{t("console.settings.audit.allTables", undefined, "All tables")}</option>
            {tables.map((tbl) => (
              <option key={tbl} value={tbl}>
                {tbl}
              </option>
            ))}
          </select>
        </div>
        <span className="text-xs text-[var(--p-text-2)]">
          {t(
            "console.settings.audit.eventsCount",
            { filtered: filtered.length, total: rows.length },
            "{filtered} / {total} events",
          )}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="ps-table w-full text-sm">
          <thead>
            <tr>
              <th className="w-8" />
              <th>{t("console.settings.audit.col.when", undefined, "When")}</th>
              <th>{t("console.settings.audit.col.action", undefined, "Action")}</th>
              <th>{t("console.settings.audit.col.target", undefined, "Target")}</th>
              <th>{t("console.settings.audit.col.actor", undefined, "Actor")}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-6 text-center text-[var(--p-text-2)]">
                  {t("console.settings.audit.empty", undefined, "No matching events.")}
                </td>
              </tr>
            ) : (
              filtered.map((r) => {
                const isOpen = open === r.id;
                const diffable = isDiffable(r.metadata);
                return (
                  <React.Fragment key={r.id}>
                    <tr
                      className={`cursor-pointer ${isOpen ? "bg-[var(--p-surface-2)]" : ""}`}
                      onClick={() => setOpen(isOpen ? null : r.id)}
                    >
                      <td className="text-center text-[var(--p-text-2)]">{diffable ? (isOpen ? "▾" : "▸") : ""}</td>
                      {/* Relative time is computed from Date.now() → unavoidably
                          differs between SSR and hydration; suppress the warning
                          (React keeps the client value). */}
                      <td className="font-mono text-xs" suppressHydrationWarning>
                        {timeAgo(r.at)}
                      </td>
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
                        {r.actor_id
                          ? r.actor_id.slice(0, 8)
                          : t("console.settings.audit.systemActor", undefined, "system")}
                      </td>
                    </tr>
                    {isOpen && (
                      <tr>
                        <td colSpan={5} className="bg-[var(--p-surface-2)]/40 px-4 py-3">
                          {diffable ? (
                            <DiffViewer
                              before={(r.metadata as { before?: unknown }).before}
                              after={(r.metadata as { after?: unknown }).after}
                            />
                          ) : (
                            <pre className="overflow-x-auto rounded bg-[var(--p-surface)] p-2 font-mono text-[11px] text-[var(--p-text-2)]">
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
