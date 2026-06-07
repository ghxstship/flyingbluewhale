import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { toTitle } from "@/lib/format";
import { RunTimeline, type RunTimelineStep } from "@/components/automations/RunTimeline";
import { RunsAutoRefresh } from "@/components/automations/RunsAutoRefresh";
import { getRequestT } from "@/lib/i18n/request";

/**
 * Run detail — single run view with per-step timeline.
 *
 * Loads the run + every `automation_step_runs` row (ordered by step_index),
 * renders header (trigger info, status, started/finished, duration, error
 * summary), and hands the step list to <RunTimeline>. While the run is
 * still in flight, mounts <RunsAutoRefresh> to flip the timeline as steps
 * complete. Per [SmartSuite Run History](https://help.smartsuite.com/en/articles/7115398-automation-run-history-erroring).
 */

export const dynamic = "force-dynamic";

type RunRow = {
  id: string;
  automation_id: string;
  trigger_kind: string;
  trigger_payload: unknown;
  status: "pending" | "running" | "success" | "failed" | "cancelled";
  started_at: string | null;
  finished_at: string | null;
  error_summary: string | null;
  action_count: number;
  triggered_by: string | null;
};

type StepRow = {
  id: string;
  step_index: number;
  action_type: string;
  status: "pending" | "running" | "success" | "failed" | "skipped";
  input: unknown;
  output: unknown;
  error: string | null;
  started_at: string | null;
  finished_at: string | null;
  latency_ms: number | null;
};

const STATUS_TONE: Record<RunRow["status"], "muted" | "info" | "success" | "warning" | "error"> = {
  pending: "muted",
  running: "info",
  success: "success",
  failed: "error",
  cancelled: "warning",
};

function fmt(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
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

export default async function Page({ params }: { params: Promise<{ automationId: string; runId: string }> }) {
  const { automationId, runId } = await params;
  const { t } = await getRequestT();

  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.ai.automations.eyebrow", undefined, "Automations")}
          title={t("console.ai.automations.runs.run.title", undefined, "Run")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.ai.automations.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }

  const session = await requireSession();
  const supabase = await createClient();

  const { data: autoRow } = await supabase
    .from("automations")
    .select("id, name")
    .eq("id", automationId)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!autoRow) notFound();
  const automation = autoRow as { id: string; name: string };

  // automation_runs / automation_step_runs aren't yet in the generated
  // database.types.ts; cast through unknown to keep this page compiling
  // pre-typegen.
  const { data: runData } = await supabase
    .from("automation_runs" as never)
    .select(
      "id, automation_id, trigger_kind, trigger_payload, status, started_at, finished_at, error_summary, action_count, triggered_by",
    )
    .eq("id", runId)
    .eq("automation_id", automationId)
    .maybeSingle();
  const run = runData as unknown as RunRow | null;
  if (!run) notFound();

  const { data: stepsData } = await supabase
    .from("automation_step_runs" as never)
    .select("id, step_index, action_type, status, input, output, error, started_at, finished_at, latency_ms")
    .eq("run_id", runId)
    .order("step_index", { ascending: true });
  const stepRows = (stepsData ?? []) as unknown as StepRow[];

  const steps: RunTimelineStep[] = stepRows.map((s) => ({
    stepIndex: s.step_index,
    actionType: s.action_type,
    status: s.status,
    input: s.input,
    output: s.output,
    error: s.error ?? undefined,
    startedAt: s.started_at ?? undefined,
    finishedAt: s.finished_at ?? undefined,
    latencyMs: s.latency_ms ?? undefined,
  }));

  const runDuration = fmtDuration(durationMs(run.started_at, run.finished_at));
  const inFlight = run.status === "running" || run.status === "pending";

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.ai.automations.eyebrow", undefined, "Automations")}
        title={t("console.ai.automations.runs.detail.title", undefined, "Run Detail")}
        subtitle={
          <span className="font-mono text-xs">
            {automation.name} · {run.trigger_kind}
          </span>
        }
        breadcrumbs={[
          { label: t("console.ai.automations.eyebrow", undefined, "Automations"), href: "/console/ai/automations" },
          { label: automation.name, href: `/console/ai/automations/${automationId}` },
          {
            label: t("console.ai.automations.runs.breadcrumb", undefined, "Runs"),
            href: `/console/ai/automations/${automationId}/runs`,
          },
          { label: fmt(run.started_at) },
        ]}
        action={<Badge variant={STATUS_TONE[run.status] ?? "muted"}>{toTitle(run.status)}</Badge>}
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard
            label={t("console.ai.automations.runs.detail.started", undefined, "Started")}
            value={fmt(run.started_at)}
          />
          <MetricCard
            label={t("console.ai.automations.runs.detail.finished", undefined, "Finished")}
            value={fmt(run.finished_at)}
          />
          <MetricCard
            label={t("console.ai.automations.runs.detail.duration", undefined, "Duration")}
            value={runDuration}
            accent={run.status === "success"}
          />
        </div>

        {run.status === "failed" && run.error_summary && (
          <section className="surface rounded border border-[var(--p-danger)] p-4">
            <h3 className="text-sm font-semibold text-[var(--p-danger)]">
              {t("console.ai.automations.runs.detail.errorSummary", undefined, "Error Summary")}
            </h3>
            <pre className="mt-2 overflow-auto font-mono text-xs whitespace-pre-wrap">{run.error_summary}</pre>
          </section>
        )}

        <section className="surface p-4">
          <h3 className="text-sm font-semibold">
            {t("console.ai.automations.runs.detail.triggerPayload", undefined, "Trigger Payload")}
          </h3>
          <pre className="mt-2 max-h-60 overflow-auto rounded bg-[var(--p-surface)] p-3 font-mono text-xs">
            {JSON.stringify(run.trigger_payload ?? {}, null, 2)}
          </pre>
        </section>

        <section className="surface p-4">
          <h3 className="text-sm font-semibold">
            {t("console.ai.automations.runs.detail.steps", undefined, "Steps")}{" "}
            <span className="font-mono text-xs text-[var(--p-text-2)]">({steps.length})</span>
          </h3>
          <div className="mt-3">
            <RunTimeline steps={steps} />
          </div>
        </section>

        {inFlight && (
          <p className="text-xs text-[var(--p-text-2)]">
            {t(
              "console.ai.automations.runs.detail.autoRefreshHint",
              undefined,
              "Auto-refreshing every 5s while the run is in flight.",
            )}
          </p>
        )}
      </div>

      {inFlight && <RunsAutoRefresh intervalMs={5000} />}
    </>
  );
}
