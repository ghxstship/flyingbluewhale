import Link from "next/link";
import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { toTitle } from "@/lib/format";
import { RunsAutoRefresh } from "@/components/automations/RunsAutoRefresh";
import { getRequestT } from "@/lib/i18n/request";

/**
 * Run history — list view.
 *
 * Reads `automation_runs` filtered to a single automation, orders newest
 * first, and renders a SmartSuite-style table with status, action count,
 * duration, and trigger info. A status-filter bar narrows the view; an
 * auto-refresh widget polls every 5s so in-flight runs flip without a
 * manual reload. Per [SmartSuite Run History](https://help.smartsuite.com/en/articles/7115398-automation-run-history-erroring).
 */

export const dynamic = "force-dynamic";

type RunRow = {
  id: string;
  trigger_kind: string;
  status: "pending" | "running" | "success" | "failed" | "cancelled";
  started_at: string | null;
  finished_at: string | null;
  action_count: number;
  error_summary: string | null;
  triggered_by: string | null;
};

const STATUS_TONE: Record<RunRow["status"], "muted" | "info" | "success" | "warning" | "error"> = {
  pending: "muted",
  running: "info",
  success: "success",
  failed: "error",
  cancelled: "warning",
};

const STATUS_FILTERS: Array<{ key: "all" | RunRow["status"]; label: string }> = [
  { key: "all", label: "All" },
  { key: "success", label: "Success" },
  { key: "failed", label: "Failed" },
  { key: "running", label: "Running" },
  { key: "pending", label: "Pending" },
];

function fmt(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function durationMs(started: string | null, finished: string | null): number | null {
  if (!started || !finished) return null;
  const s = Date.parse(started);
  const f = Date.parse(finished);
  if (!Number.isFinite(s) || !Number.isFinite(f)) return null;
  return Math.max(0, f - s);
}

function fmtDuration(ms: number | null): string {
  if (ms == null) return "—";
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  const m = Math.floor(ms / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  return `${m}m ${s}s`;
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ automationId: string }>;
  searchParams?: Promise<{ status?: string }>;
}) {
  const { automationId } = await params;
  const sp = (await searchParams) ?? {};
  const statusFilter = (sp.status ?? "all") as "all" | RunRow["status"];
  const { t } = await getRequestT();

  const STATUS_FILTER_LABELS: Record<"all" | RunRow["status"], string> = {
    all: t("common.all", undefined, "All"),
    success: t("console.ai.automations.runs.filter.success", undefined, "Success"),
    failed: t("console.ai.automations.runs.filter.failed", undefined, "Failed"),
    running: t("console.ai.automations.runs.filter.running", undefined, "Running"),
    pending: t("console.ai.automations.runs.filter.pending", undefined, "Pending"),
    cancelled: t("console.ai.automations.runs.filter.cancelled", undefined, "Cancelled"),
  };

  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.ai.automations.runs.eyebrow", undefined, "Automations")}
          title={t("console.ai.automations.runs.title", undefined, "Run History")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.ai.automations.runs.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }

  const session = await requireSession();
  const supabase = await createClient();

  // Verify automation exists + caller has access (RLS enforces the org bound,
  // but we want a 404 if the path is bogus).
  const { data: autoRow } = await supabase
    .from("automations")
    .select("id, name")
    .eq("id", automationId)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!autoRow) notFound();
  const automation = autoRow as { id: string; name: string };

  let query = supabase
    // automation_runs may not yet be in the generated database.types.ts;
    // cast through unknown to keep the page compiling pre-typegen.
    .from("automation_runs" as never)
    .select("id, trigger_kind, run_state, started_at, finished_at, action_count, error_summary, triggered_by")
    .eq("automation_id", automationId)
    .order("started_at", { ascending: false })
    .limit(200);

  if (statusFilter !== "all") {
    query = query.eq("run_state", statusFilter);
  }

  const { data: runsData } = await query;
  const runs = (runsData ?? []) as unknown as RunRow[];

  const inFlight = runs.some((r) => r.status === "running" || r.status === "pending");

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.ai.automations.runs.eyebrow", undefined, "Automations")}
        title={t("console.ai.automations.runs.title", undefined, "Run History")}
        subtitle={
          <span className="font-mono text-xs">
            {automation.name} ·{" "}
            {runs.length === 1
              ? t("console.ai.automations.runs.countOne", { count: runs.length }, "1 run")
              : t("console.ai.automations.runs.countOther", { count: runs.length }, `${runs.length} runs`)}
          </span>
        }
        breadcrumbs={[
          {
            label: t("console.ai.automations.runs.crumb.automations", undefined, "Automations"),
            href: "/console/ai/automations",
          },
          { label: automation.name, href: `/console/ai/automations/${automationId}` },
          { label: t("console.ai.automations.runs.crumb.runs", undefined, "Runs") },
        ]}
      />
      <div className="page-content space-y-4">
        {/* Status filter chips — round-tripped through ?status=… so the
            filter survives the auto-refresh round-trip. */}
        <div className="flex flex-wrap items-center gap-2">
          {STATUS_FILTERS.map((f) => {
            const active = statusFilter === f.key;
            const href =
              f.key === "all"
                ? `/console/ai/automations/${automationId}/runs`
                : `/console/ai/automations/${automationId}/runs?status=${f.key}`;
            return (
              <Link
                key={f.key}
                href={href}
                className={
                  active
                    ? "rounded border border-[var(--p-accent)] bg-[var(--org-primary-soft)] px-3 py-1 text-xs font-semibold text-[var(--p-accent)]"
                    : "rounded border border-[var(--p-border)] px-3 py-1 text-xs text-[var(--p-text-2)] hover:bg-[var(--p-surface)]"
                }
              >
                {STATUS_FILTER_LABELS[f.key] ?? f.label}
              </Link>
            );
          })}
        </div>

        {runs.length === 0 ? (
          <EmptyState
            title={t("console.ai.automations.runs.empty.title", undefined, "No Runs Yet")}
            description={t(
              "console.ai.automations.runs.empty.description",
              undefined,
              "Trigger this automation manually or wait for its scheduler / webhook / event to fire.",
            )}
          />
        ) : (
          <div className="surface overflow-hidden">
            <table className="ps-table w-full text-sm">
              <thead>
                <tr>
                  <th className="px-3 py-2 text-start text-xs tracking-wide uppercase">
                    {t("console.ai.automations.runs.col.started", undefined, "Started")}
                  </th>
                  <th className="px-3 py-2 text-start text-xs tracking-wide uppercase">
                    {t("console.ai.automations.runs.col.trigger", undefined, "Trigger")}
                  </th>
                  <th className="px-3 py-2 text-start text-xs tracking-wide uppercase">
                    {t("console.ai.automations.runs.col.status", undefined, "Status")}
                  </th>
                  <th className="px-3 py-2 text-right text-xs tracking-wide uppercase">
                    {t("console.ai.automations.runs.col.actions", undefined, "Actions")}
                  </th>
                  <th className="px-3 py-2 text-start text-xs tracking-wide uppercase">
                    {t("console.ai.automations.runs.col.finished", undefined, "Finished")}
                  </th>
                  <th className="px-3 py-2 text-right text-xs tracking-wide uppercase">
                    {t("console.ai.automations.runs.col.duration", undefined, "Duration")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {runs.map((r) => {
                  const dur = durationMs(r.started_at, r.finished_at);
                  return (
                    <tr key={r.id} className="border-t border-[var(--p-border)]">
                      <td className="px-3 py-2 font-mono text-xs">
                        <Link href={`/console/ai/automations/${automationId}/runs/${r.id}`} className="hover:underline">
                          {fmt(r.started_at)}
                        </Link>
                      </td>
                      <td className="px-3 py-2 font-mono text-xs">{r.trigger_kind}</td>
                      <td className="px-3 py-2">
                        <Badge variant={STATUS_TONE[r.status] ?? "muted"}>{toTitle(r.status)}</Badge>
                        {r.status === "failed" && r.error_summary && (
                          <span
                            className="ms-2 truncate font-mono text-[10px] text-[var(--p-danger)]"
                            title={r.error_summary}
                          >
                            {r.error_summary.slice(0, 60)}
                            {r.error_summary.length > 60 ? "…" : ""}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">{r.action_count}</td>
                      <td className="px-3 py-2 font-mono text-xs">{fmt(r.finished_at)}</td>
                      <td className="px-3 py-2 text-right font-mono text-xs">{fmtDuration(dur)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <p className="text-xs text-[var(--p-text-2)]">
          {inFlight
            ? t(
                "console.ai.automations.runs.autoRefreshing",
                undefined,
                "Auto-refreshing every 5s while runs are in flight.",
              )
            : t("console.ai.automations.runs.upToDate", undefined, "Up to date.")}
        </p>
      </div>

      <RunsAutoRefresh intervalMs={5000} />
    </>
  );
}
