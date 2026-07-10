import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Button, buttonVariants } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { toneFor } from "@/lib/tones";

export const dynamic = "force-dynamic";

type AutomationRow = {
  id: string;
  name: string;
  description: string | null;
  trigger_kind: string;
  enabled: boolean;
  last_run_at: string | null;
  last_run_status: string | null;
  updated_at: string;
};

const TRIGGER_TONE: Record<string, "muted" | "info" | "success" | "warning"> = {
  manual: "muted",
  schedule: "info",
  webhook: "info",
  event: "success",
};

function relativeTime(
  iso: string | null,
  t: (key: string, vars?: Record<string, string | number>, fallback?: string) => string,
): string {
  if (!iso) return "—";
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.floor(ms / 60_000);
  if (min < 60) return t("console.ai.automations.relativeMinutes", { value: min }, `${min}m ago`);
  const hr = Math.floor(min / 60);
  if (hr < 24) return t("console.ai.automations.relativeHours", { value: hr }, `${hr}h ago`);
  const days = Math.floor(hr / 24);
  return t("console.ai.automations.relativeDays", { value: days }, `${days}d ago`);
}

export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.ai.eyebrow", undefined, "AI")}
          title={t("console.ai.automations.title", undefined, "Automations")}
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
  const fmt = await getRequestFormatters();
  const { data } = await supabase
    .from("automations")
    .select("id, name, description, trigger_kind, enabled, last_run_at, last_run_status, updated_at")
    .eq("org_id", session.orgId)
    .order("updated_at", { ascending: false })
    .limit(200);

  const rows = (data ?? []) as AutomationRow[];
  const enabled = rows.filter((r) => r.enabled).length;
  const failing = rows.filter((r) => r.last_run_status && ["failed", "error"].includes(r.last_run_status)).length;

  // Recent Runs (kit 21 W7 · Zapier canon) — the run-history trust surface.
  // One batched query for the org's recent runs, grouped per automation; each
  // row shows its last ~7 outcomes as a ✓/✗ glyph strip (newest last).
  const recentByAutomation = new Map<string, Array<{ state: string; at: string; error: string | null }>>();
  if (rows.length > 0) {
    const { data: runs } = await supabase
      .from("automation_runs")
      .select("automation_id, run_state, error_summary, created_at")
      .eq("org_id", session.orgId)
      .in(
        "automation_id",
        rows.map((r) => r.id),
      )
      .order("created_at", { ascending: false })
      .limit(500);
    for (const run of (runs ?? []) as Array<{
      automation_id: string;
      run_state: string;
      error_summary: string | null;
      created_at: string;
    }>) {
      const list = recentByAutomation.get(run.automation_id) ?? [];
      if (list.length < 7) {
        list.push({ state: run.run_state, at: run.created_at, error: run.error_summary });
        recentByAutomation.set(run.automation_id, list);
      }
    }
  }

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.ai.eyebrow", undefined, "AI")}
        title={t("console.ai.automations.title", undefined, "Automations")}
        subtitle={`${rows.length} ${rows.length === 1 ? t("console.ai.automations.subtitleAutomationOne", undefined, "automation") : t("console.ai.automations.subtitleAutomationOther", undefined, "automations")} · ${enabled} ${t("console.ai.automations.subtitleEnabled", undefined, "enabled")}${failing ? ` · ${failing} ${t("console.ai.automations.subtitleFailing", undefined, "failing")}` : ""}`}
        action={
          <Button href="/studio/ai/automations/new" size="sm">
            {t("console.ai.automations.newAction", undefined, "+ New Automation")}
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard
            label={t("console.ai.automations.metricEnabled", undefined, "Enabled")}
            value={fmt.number(enabled)}
            accent
          />
          <MetricCard
            label={t("console.ai.automations.metricTotal", undefined, "Total")}
            value={fmt.number(rows.length)}
          />
          <MetricCard
            label={t("console.ai.automations.metricFailingLastRun", undefined, "Failing Last Run")}
            value={fmt.number(failing)}
          />
        </div>

        {rows.length === 0 ? (
          <EmptyState
            title={t("console.ai.automations.emptyTitle", undefined, "No Automations Yet")}
            description={t(
              "console.ai.automations.emptyDescription",
              undefined,
              "Author AI-driven automations triggered manually, on a cron schedule, by webhooks, or by domain events.",
            )}
            action={
              <Link href="/studio/ai/automations/new" className={buttonVariants({ size: "sm" })}>
                {t("console.ai.automations.newAction", undefined, "+ New Automation")}
              </Link>
            }
          />
        ) : (
          <ul className="space-y-2">
            {rows.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/studio/ai/automations/${r.id}`}
                  className="surface flex items-center justify-between p-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      {r.name}
                      <Badge variant={TRIGGER_TONE[r.trigger_kind] ?? "muted"}>{r.trigger_kind}</Badge>
                      {!r.enabled && (
                        <Badge variant="muted">{t("console.ai.automations.disabled", undefined, "Disabled")}</Badge>
                      )}
                    </div>
                    {r.description && (
                      <p className="mt-0.5 line-clamp-1 text-xs text-[var(--p-text-2)]">{r.description}</p>
                    )}
                    <div className="mt-1 flex items-center gap-2 font-mono text-xs text-[var(--p-text-2)]">
                      <RunStrip
                        runs={recentByAutomation.get(r.id) ?? []}
                        noneLabel={t("console.ai.automations.noRuns", undefined, "No runs yet")}
                      />
                      <span>
                        {t(
                          "console.ai.automations.lastRun",
                          { time: relativeTime(r.last_run_at, t) },
                          `Last run ${relativeTime(r.last_run_at, t)}`,
                        )}
                      </span>
                    </div>
                  </div>
                  {r.last_run_status && <Badge variant={toneFor(r.last_run_status)}>{r.last_run_status}</Badge>}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

/**
 * Recent Runs glyph strip (kit 21 W7) — a run's outcome as a ✓ (ok) / ✗
 * (failed) / · (running/pending) tick, oldest→newest left to right. Native
 * title carries the per-run timestamp + error summary. Empty = never ran.
 */
const RUN_GLYPH: Record<string, { ch: string; cls: string }> = {
  succeeded: { ch: "✓", cls: "text-[var(--p-success-text)]" },
  success: { ch: "✓", cls: "text-[var(--p-success-text)]" },
  completed: { ch: "✓", cls: "text-[var(--p-success-text)]" },
  failed: { ch: "✗", cls: "text-[var(--p-danger-text)]" },
  error: { ch: "✗", cls: "text-[var(--p-danger-text)]" },
  running: { ch: "·", cls: "text-[var(--p-text-3)]" },
  pending: { ch: "·", cls: "text-[var(--p-text-3)]" },
  queued: { ch: "·", cls: "text-[var(--p-text-3)]" },
  cancelled: { ch: "○", cls: "text-[var(--p-text-3)]" },
};

function RunStrip({
  runs,
  noneLabel,
}: {
  runs: Array<{ state: string; at: string; error: string | null }>;
  noneLabel: string;
}) {
  if (runs.length === 0) return <span className="text-[var(--p-text-3)]">{noneLabel}</span>;
  // Stored newest-first; render oldest-first so the strip reads chronologically.
  const chrono = runs.slice().reverse();
  return (
    <span className="inline-flex items-center gap-0.5" aria-label="Recent runs">
      {chrono.map((run, i) => {
        const g = RUN_GLYPH[run.state] ?? { ch: "·", cls: "text-[var(--p-text-3)]" };
        const tip = `${run.state}${run.error ? `: ${run.error}` : ""}`;
        return (
          <span key={i} className={g.cls} title={tip} aria-hidden="true">
            {g.ch}
          </span>
        );
      })}
    </span>
  );
}
