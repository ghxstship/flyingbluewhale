import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";

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

const RUN_TONE: Record<string, "muted" | "success" | "warning" | "error"> = {
  ok: "success",
  success: "success",
  failed: "error",
  error: "error",
  running: "warning",
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

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.ai.eyebrow", undefined, "AI")}
        title={t("console.ai.automations.title", undefined, "Automations")}
        subtitle={`${rows.length} ${rows.length === 1 ? t("console.ai.automations.subtitleAutomationOne", undefined, "automation") : t("console.ai.automations.subtitleAutomationOther", undefined, "automations")} · ${enabled} ${t("console.ai.automations.subtitleEnabled", undefined, "enabled")}${failing ? ` · ${failing} ${t("console.ai.automations.subtitleFailing", undefined, "failing")}` : ""}`}
        action={
          <Button href="/console/ai/automations/new" size="sm">
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
              <Link href="/console/ai/automations/new" className="ps-btn ps-btn--sm">
                {t("console.ai.automations.newAction", undefined, "+ New Automation")}
              </Link>
            }
          />
        ) : (
          <ul className="space-y-2">
            {rows.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/console/ai/automations/${r.id}`}
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
                    <div className="mt-1 font-mono text-xs text-[var(--p-text-2)]">
                      {t(
                        "console.ai.automations.lastRun",
                        { time: relativeTime(r.last_run_at, t) },
                        `Last run ${relativeTime(r.last_run_at, t)}`,
                      )}
                    </div>
                  </div>
                  {r.last_run_status && (
                    <Badge variant={RUN_TONE[r.last_run_status] ?? "muted"}>{r.last_run_status}</Badge>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
