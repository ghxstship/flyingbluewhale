"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusChip } from "@/components/ui/StatusChip";
import { Download, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";
import { useFormatters, useT } from "@/lib/i18n/LocaleProvider";
import { toTitle } from "@/lib/format";

/**
 * Export Centre — async-aware client shell.
 *
 *  - Hosts the new-export form.
 *  - Lists the org's export_runs + polls `/api/v1/exports` every 5s so
 *    pending/processing runs flip to complete without a reload.
 *  - Offers a re-download action that mints a fresh signed URL via
 *    `/api/v1/exports/[id]/download` (original URLs expire in 10 min).
 *  - Surfaces last_error on failed runs with a dismissable alert row.
 */

type Run = {
  id: string;
  kind: string;
  params: Record<string, unknown> | null;
  status: "pending" | "running" | "done" | "failed";
  file_path: string | null;
  size_bytes: number | null;
  row_count: number | null;
  created_at: string;
  completed_at: string | null;
  last_error: string | null;
};

type TableOption = { value: string; labelKey: string; defaultLabel: string };
const TABLES: TableOption[] = [
  { value: "projects", labelKey: "console.settings.exports.tables.projects", defaultLabel: "Projects" },
  { value: "deliverables", labelKey: "console.settings.exports.tables.deliverables", defaultLabel: "Deliverables" },
  { value: "invoices", labelKey: "console.settings.exports.tables.invoices", defaultLabel: "Invoices" },
  { value: "tasks", labelKey: "console.settings.exports.tables.tasks", defaultLabel: "Tasks" },
  { value: "tickets", labelKey: "console.settings.exports.tables.tickets", defaultLabel: "Tickets" },
  { value: "crew_members", labelKey: "console.settings.exports.tables.crewMembers", defaultLabel: "Crew Roster" },
  { value: "vendors", labelKey: "console.settings.exports.tables.vendors", defaultLabel: "Vendors" },
  { value: "audit_log", labelKey: "console.settings.exports.tables.auditLog", defaultLabel: "Audit Log" },
];

type KindOption = { value: string; labelKey: string; defaultLabel: string };
const KINDS: KindOption[] = [
  { value: "csv", labelKey: "console.settings.exports.kinds.csv", defaultLabel: "CSV" },
  { value: "json", labelKey: "console.settings.exports.kinds.json", defaultLabel: "JSON" },
  { value: "xlsx", labelKey: "console.settings.exports.kinds.xlsx", defaultLabel: "Excel (XLSX)" },
  { value: "zip", labelKey: "console.settings.exports.kinds.zip", defaultLabel: "ZIP (CSV + JSON)" },
];

type StatusIcon = React.ComponentType<{ size?: number; className?: string }>;
const STATUS_TONES: Record<Run["status"], { tone: "neutral" | "info" | "success" | "danger"; Icon: StatusIcon }> = {
  pending: { tone: "neutral", Icon: Loader2 },
  running: { tone: "info", Icon: Loader2 },
  done: { tone: "success", Icon: CheckCircle2 },
  failed: { tone: "danger", Icon: AlertCircle },
};

export function ExportCenter({ initial }: { initial: Run[] }) {
  const fmt = useFormatters();
  const t = useT();
  const [runs, setRuns] = useState<Run[]>(initial);
  const [kind, setKind] = useState("csv");
  const [table, setTable] = useState("projects");
  const [asyncMode, setAsyncMode] = useState(false);
  const [isPending, startTransition] = useTransition();

  const anyBusy = runs.some((r) => r.status === "pending" || r.status === "running");

  const refresh = useCallback(async () => {
    try {
      const r = await fetch("/api/v1/exports");
      const body = await r.json();
      if (body?.ok && Array.isArray(body.data?.runs)) {
        setRuns(body.data.runs as Run[]);
      }
    } catch {
      /* ignore — transient network */
    }
  }, []);

  useEffect(() => {
    if (!anyBusy) return;
    const h = setInterval(refresh, 5000);
    return () => clearInterval(h);
  }, [anyBusy, refresh]);

  function submit() {
    const useAsync = asyncMode && (kind === "csv" || kind === "json");
    startTransition(async () => {
      const r = await fetch("/api/v1/exports", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind, table, async: useAsync }),
      });
      const body = await r.json().catch(() => ({}));
      if (!r.ok || body.ok === false) {
        toast.error(body.error?.message ?? t("console.settings.exports.toast.failed", undefined, "Export failed"));
        return;
      }
      if (body.data?.queued) {
        toast.success(t("console.settings.exports.toast.queued", undefined, "Export queued — polling for completion"));
      } else {
        toast.success(t("console.settings.exports.toast.complete", undefined, "Export complete"));
        if (body.data?.signedUrl) {
          window.open(body.data.signedUrl, "_blank");
        }
      }
      void refresh();
    });
  }

  async function redownload(run: Run) {
    try {
      const r = await fetch(`/api/v1/exports/${run.id}/download`);
      const body = await r.json();
      if (body?.ok && body.data?.signedUrl) {
        window.open(body.data.signedUrl, "_blank");
      } else {
        toast.error(
          body?.error?.message ?? t("console.settings.exports.toast.downloadFailed", undefined, "Download failed"),
        );
      }
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  return (
    <div className="space-y-8">
      <section className="surface p-5">
        <h2 className="mb-3 text-sm font-semibold">
          {t("console.settings.exports.newExport", undefined, "New Export")}
        </h2>
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-xs">
            <span className="font-medium tracking-wider text-[var(--text-muted)] uppercase">
              {t("console.settings.exports.format", undefined, "Format")}
            </span>
            <select value={kind} onChange={(e) => setKind(e.target.value)} className="input-base w-40">
              {KINDS.map((k) => (
                <option key={k.value} value={k.value}>
                  {t(k.labelKey, undefined, k.defaultLabel)}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs">
            <span className="font-medium tracking-wider text-[var(--text-muted)] uppercase">
              {t("console.settings.exports.table", undefined, "Table")}
            </span>
            <select value={table} onChange={(e) => setTable(e.target.value)} className="input-base w-52">
              {TABLES.map((tbl) => (
                <option key={tbl.value} value={tbl.value}>
                  {t(tbl.labelKey, undefined, tbl.defaultLabel)}
                </option>
              ))}
            </select>
          </label>
          <Button type="button" onClick={submit} disabled={isPending}>
            {isPending
              ? t("console.settings.exports.generating", undefined, "Generating…")
              : t("console.settings.exports.runExport", undefined, "Run export")}
          </Button>
          {(kind === "csv" || kind === "json") && (
            <label className="ms-2 flex items-center gap-1 text-xs text-[var(--text-muted)]">
              <input type="checkbox" checked={asyncMode} onChange={(e) => setAsyncMode(e.target.checked)} />
              {t("console.settings.exports.queueInBackground", undefined, "Queue in background")}
            </label>
          )}
        </div>
      </section>

      <section className="surface p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">
            {t("console.settings.exports.recentRuns", undefined, "Recent Runs")}
          </h2>
          {anyBusy && (
            <span className="inline-flex items-center gap-1 text-xs text-[var(--text-muted)]">
              <Spinner size="sm" />
              {t("console.settings.exports.autoRefreshing", undefined, "Auto-refreshing while runs are in flight")}
            </span>
          )}
        </div>
        {runs.length === 0 ? (
          <EmptyState
            size="compact"
            title={t("console.settings.exports.empty.title", undefined, "No Exports Yet")}
            description={t(
              "console.settings.exports.empty.description",
              undefined,
              "Run one above and it will appear here with status, size, and row count.",
            )}
          />
        ) : (
          <table className="data-table w-full text-sm">
            <thead>
              <tr>
                <th>{t("console.settings.exports.col.when", undefined, "When")}</th>
                <th>{t("console.settings.exports.col.kind", undefined, "Kind")}</th>
                <th>{t("console.settings.exports.col.table", undefined, "Table")}</th>
                <th>{t("console.settings.exports.col.rows", undefined, "Rows")}</th>
                <th>{t("console.settings.exports.col.size", undefined, "Size")}</th>
                <th>{t("console.settings.exports.col.status", undefined, "Status")}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {runs.map((r) => {
                const params = (r.params ?? {}) as { table?: string };
                const styles = STATUS_TONES[r.status];
                const spinning = r.status === "pending" || r.status === "running";
                return (
                  <tr key={r.id}>
                    <td className="font-mono text-xs">{fmt.dateTime(r.created_at)}</td>
                    <td className="uppercase">{toTitle(r.kind)}</td>
                    <td>{params.table ?? "—"}</td>
                    <td className="font-mono text-xs">{r.row_count ?? "—"}</td>
                    <td className="font-mono text-xs">{formatBytes(r.size_bytes)}</td>
                    <td>
                      <StatusChip
                        tone={styles.tone}
                        icon={<styles.Icon size={10} className={spinning ? "motion-safe:animate-spin" : undefined} />}
                      >
                        {r.status}
                      </StatusChip>
                      {r.status === "failed" && r.last_error && (
                        <div
                          className="mt-1 max-w-xs truncate text-[10px] text-[var(--color-error)]"
                          title={r.last_error}
                        >
                          {r.last_error}
                        </div>
                      )}
                    </td>
                    <td>
                      {r.status === "done" && r.file_path && (
                        <button
                          type="button"
                          onClick={() => redownload(r)}
                          aria-label={t("console.settings.exports.downloadAgain", undefined, "Download Again")}
                          className="inline-flex items-center gap-1 rounded border border-[var(--border-color)] px-2 py-1 text-[10px] hover:bg-[var(--surface-inset)]"
                        >
                          <Download size={10} /> {t("console.settings.exports.download", undefined, "Download")}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

function formatBytes(n: number | null): string {
  if (n == null) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}
