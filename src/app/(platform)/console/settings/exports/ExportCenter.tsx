"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Download, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

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

const TABLES = [
  { value: "projects", label: "Projects" },
  { value: "deliverables", label: "Deliverables" },
  { value: "invoices", label: "Invoices" },
  { value: "tasks", label: "Tasks" },
  { value: "tickets", label: "Tickets" },
  { value: "crew_members", label: "Crew roster" },
  { value: "vendors", label: "Vendors" },
  { value: "audit_log", label: "Audit log" },
];

const KINDS = [
  { value: "csv", label: "CSV" },
  { value: "json", label: "JSON" },
  { value: "xlsx", label: "Excel (XLSX)" },
  { value: "zip", label: "ZIP (CSV + JSON)" },
];

const STATUS_STYLES: Record<
  Run["status"],
  { bg: string; fg: string; Icon: React.ComponentType<{ size?: number; className?: string }> }
> = {
  pending: { bg: "bg-slate-500/10", fg: "text-slate-600", Icon: Loader2 },
  running: { bg: "bg-sky-500/10", fg: "text-sky-700", Icon: Loader2 },
  done: { bg: "bg-emerald-500/10", fg: "text-emerald-700", Icon: CheckCircle2 },
  failed: { bg: "bg-rose-500/10", fg: "text-rose-700", Icon: AlertCircle },
};

export function ExportCenter({ initial }: { initial: Run[] }) {
  const [runs, setRuns] = useState<Run[]>(initial);
  const [kind, setKind] = useState("csv");
  const [table, setTable] = useState("projects");
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
    startTransition(async () => {
      const r = await fetch("/api/v1/exports", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind, table }),
      });
      const body = await r.json().catch(() => ({}));
      if (!r.ok || body.ok === false) {
        toast.error(body.error?.message ?? "Export failed");
        return;
      }
      toast.success("Export complete");
      if (body.data?.signedUrl) {
        window.open(body.data.signedUrl, "_blank");
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
        toast.error(body?.error?.message ?? "Download failed");
      }
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  return (
    <div className="space-y-8">
      <section className="surface p-5">
        <h2 className="mb-3 text-sm font-semibold">New export</h2>
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-xs">
            <span className="font-medium uppercase tracking-wider text-[var(--text-muted)]">Format</span>
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value)}
              className="input-base w-40"
            >
              {KINDS.map((k) => (
                <option key={k.value} value={k.value}>
                  {k.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs">
            <span className="font-medium uppercase tracking-wider text-[var(--text-muted)]">Table</span>
            <select
              value={table}
              onChange={(e) => setTable(e.target.value)}
              className="input-base w-52"
            >
              {TABLES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          <Button type="button" onClick={submit} disabled={isPending}>
            {isPending ? "Generating…" : "Run export"}
          </Button>
        </div>
      </section>

      <section className="surface p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Recent runs</h2>
          {anyBusy && (
            <span className="inline-flex items-center gap-1 text-xs text-[var(--text-muted)]">
              <Loader2 size={12} className="animate-spin" />
              Auto-refreshing while runs are in flight
            </span>
          )}
        </div>
        {runs.length === 0 ? (
          <EmptyState
            size="compact"
            title="No exports yet"
            description="Run one above and it will appear here with status, size, and row count."
          />
        ) : (
          <table className="data-table w-full text-sm">
            <thead>
              <tr>
                <th>When</th>
                <th>Kind</th>
                <th>Table</th>
                <th>Rows</th>
                <th>Size</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {runs.map((r) => {
                const params = (r.params ?? {}) as { table?: string };
                const styles = STATUS_STYLES[r.status];
                const spinning = r.status === "pending" || r.status === "running";
                return (
                  <tr key={r.id}>
                    <td className="font-mono text-xs">{new Date(r.created_at).toLocaleString()}</td>
                    <td className="uppercase">{r.kind}</td>
                    <td>{params.table ?? "—"}</td>
                    <td className="font-mono text-xs">{r.row_count ?? "—"}</td>
                    <td className="font-mono text-xs">{formatBytes(r.size_bytes)}</td>
                    <td>
                      <span
                        className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${styles.bg} ${styles.fg}`}
                      >
                        <styles.Icon size={10} className={spinning ? "animate-spin" : undefined} />
                        {r.status}
                      </span>
                      {r.status === "failed" && r.last_error && (
                        <div className="mt-1 max-w-xs truncate text-[10px] text-[var(--color-error)]" title={r.last_error}>
                          {r.last_error}
                        </div>
                      )}
                    </td>
                    <td>
                      {r.status === "done" && r.file_path && (
                        <button
                          type="button"
                          onClick={() => redownload(r)}
                          aria-label="Download again"
                          className="inline-flex items-center gap-1 rounded border border-[var(--border-color)] px-2 py-1 text-[10px] hover:bg-[var(--surface-inset)]"
                        >
                          <Download size={10} /> Download
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
