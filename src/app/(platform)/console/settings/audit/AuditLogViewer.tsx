"use client";

import * as React from "react";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { DiffViewer } from "@/components/charts/DiffViewer";
import { useT } from "@/lib/i18n/LocaleProvider";
import { timeAgo } from "@/lib/format";
import type { AuditLog } from "@/lib/supabase/types";

/**
 * Audit log viewer with click-to-expand diff per row + actor / action /
 * target-table filters. Modeled on Notion's audit panel and GitHub's
 * commit page. Each row's `metadata` is treated as `{ before, after }`
 * when both fields are present; otherwise we render whatever shape exists.
 */
export function AuditLogViewer({ rows }: { rows: AuditLog[] }) {
  const t = useT();
  const [actorFilter, setActorFilter] = React.useState("");
  const [actionFilter, setActionFilter] = React.useState("");
  const [tableFilter, setTableFilter] = React.useState("");
  const [open, setOpen] = React.useState<string | null>(null);

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
            label={t("console.settings.audit.actorLabel", undefined, "Actor — UUID Prefix")}
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
                            <pre className="overflow-x-auto rounded bg-[var(--p-surface)] p-2 font-mono text-[10px] text-[var(--p-text-2)]">
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
