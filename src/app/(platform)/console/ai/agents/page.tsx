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

export const dynamic = "force-dynamic";

type AgentRow = {
  id: string;
  target_table: string;
  target_column: string;
  output_type: string;
  enabled: boolean;
  updated_at: string;
};

export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.ai.eyebrow", undefined, "AI")}
          title={t("console.ai.agents.title", undefined, "Field Agents")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.ai.agents.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();
  const { data } = await supabase
    .from("ai_agents")
    .select("id, target_table, target_column, output_type, enabled, updated_at")
    .eq("org_id", session.orgId)
    .order("updated_at", { ascending: false })
    .limit(200);

  const rows = (data ?? []) as AgentRow[];
  const enabled = rows.filter((r) => r.enabled).length;

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.ai.eyebrow", undefined, "AI")}
        title={t("console.ai.agents.title", undefined, "Field Agents")}
        subtitle={`${rows.length} ${rows.length === 1 ? t("console.ai.agents.subtitleAgentOne", undefined, "agent") : t("console.ai.agents.subtitleAgentOther", undefined, "agents")} · ${enabled} ${t("console.ai.agents.subtitleEnabled", undefined, "enabled")}`}
        action={
          <Button href="/console/ai/agents/new" size="sm">
            {t("console.ai.agents.newAction", undefined, "+ New Agent")}
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard
            label={t("console.ai.agents.metricEnabled", undefined, "Enabled")}
            value={fmt.number(enabled)}
            accent
          />
          <MetricCard label={t("console.ai.agents.metricTotal", undefined, "Total")} value={fmt.number(rows.length)} />
          <MetricCard
            label={t("console.ai.agents.metricDisabled", undefined, "Disabled")}
            value={fmt.number(rows.length - enabled)}
          />
        </div>

        {rows.length === 0 ? (
          <EmptyState
            title={t("console.ai.agents.emptyTitle", undefined, "No Field Agents Yet")}
            description={t(
              "console.ai.agents.emptyDescription",
              undefined,
              "Author AI field agents that re-render a prompt against a record's source columns and write the result back to a target column.",
            )}
            action={
              <Link href="/console/ai/agents/new" className={buttonVariants({ size: "sm" })}>
                {t("console.ai.agents.newAction", undefined, "+ New Agent")}
              </Link>
            }
          />
        ) : (
          <ul className="space-y-2">
            {rows.map((r) => (
              <li key={r.id}>
                <Link href={`/console/ai/agents/${r.id}`} className="surface flex items-center justify-between p-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <span className="font-mono">
                        {r.target_table}.{r.target_column}
                      </span>
                      <Badge variant="muted">{r.output_type}</Badge>
                      {!r.enabled && (
                        <Badge variant="muted">{t("console.ai.agents.disabled", undefined, "Disabled")}</Badge>
                      )}
                    </div>
                    <div className="mt-1 font-mono text-xs text-[var(--p-text-2)]">{r.target_table}</div>
                  </div>
                  <Badge variant={r.enabled ? "success" : "muted"}>
                    {r.enabled
                      ? t("console.ai.agents.enabled", undefined, "Enabled")
                      : t("console.ai.agents.disabled", undefined, "Disabled")}
                  </Badge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
