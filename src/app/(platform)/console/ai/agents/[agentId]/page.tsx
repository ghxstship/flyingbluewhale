import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { DeleteForm } from "@/components/DeleteForm";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { AgentControls } from "./AgentControls";
import { deleteAgentAction } from "./actions";

export const dynamic = "force-dynamic";

type AgentRow = {
  id: string;
  target_table: string;
  target_column: string;
  source_columns: string[];
  prompt_template: string;
  output_type: string;
  model: string;
  max_tokens: number;
  auto_refresh: boolean;
  enabled: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

function fmt(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function Page({ params }: { params: Promise<{ agentId: string }> }) {
  const { agentId } = await params;
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.ai.agents.eyebrow", undefined, "Field Agents")}
          title={t("console.ai.agents.detail.titleFallback", undefined, "Field Agent")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.ai.agents.detail.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const { data } = await supabase
    .from("ai_agents")
    .select(
      "id, target_table, target_column, source_columns, prompt_template, output_type, model, max_tokens, auto_refresh, enabled, created_by, created_at, updated_at",
    )
    .eq("id", agentId)
    .eq("org_id", session.orgId)
    .maybeSingle();

  const agent = data as AgentRow | null;
  if (!agent) notFound();

  // Resolve the created_by audit reference to a human label.
  let createdByLabel: string | null = null;
  if (agent.created_by) {
    const { data: creator } = await supabase
      .from("users")
      .select("name, email")
      .eq("id", agent.created_by)
      .maybeSingle();
    const c = creator as { name: string | null; email: string | null } | null;
    createdByLabel = c?.name ?? c?.email ?? agent.created_by;
  }

  const name = `${agent.target_table}.${agent.target_column}`;

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.ai.agents.eyebrow", undefined, "Field Agents")}
        title={name}
        subtitle={
          <span className="font-mono text-xs">
            {agent.output_type} · {t("console.ai.agents.detail.updatedLabel", undefined, "updated")}{" "}
            {fmt(agent.updated_at)}
          </span>
        }
        breadcrumbs={[
          { label: t("console.ai.agents.eyebrow", undefined, "Field Agents"), href: "/console/ai/agents" },
          { label: name },
        ]}
        action={
          <div className="flex items-center gap-2">
            <Badge variant={agent.enabled ? "success" : "muted"}>
              {agent.enabled
                ? t("console.ai.agents.detail.enabled", undefined, "Enabled")
                : t("console.ai.agents.detail.disabled", undefined, "Disabled")}
            </Badge>
            <DeleteForm
              action={deleteAgentAction.bind(null, agent.id)}
              confirm={t(
                "console.ai.agents.detail.deleteConfirm",
                undefined,
                "Delete this field agent? This cannot be undone.",
              )}
            />
          </div>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard
            label={t("console.ai.agents.detail.metricTarget", undefined, "Target")}
            value={`${agent.target_table}.${agent.target_column}`}
          />
          <MetricCard label={t("console.ai.agents.detail.metricModel", undefined, "Model")} value={agent.model} />
          <MetricCard
            label={t("console.ai.agents.detail.metricOutput", undefined, "Output Type")}
            value={agent.output_type}
            accent
          />
        </div>

        <section className="surface p-4">
          <h3 className="text-sm font-semibold">
            {t("console.ai.agents.detail.controlsHeading", undefined, "Controls")}
          </h3>
          <p className="mt-1 text-xs text-[var(--p-text-2)]">
            {t(
              "console.ai.agents.detail.controlsHelp",
              undefined,
              "Toggle the agent on or off. Disabled agents are skipped by the executor.",
            )}
          </p>
          <div className="mt-3">
            <AgentControls agentId={agent.id} enabled={agent.enabled} />
          </div>
        </section>

        <section className="surface p-4">
          <h3 className="text-sm font-semibold">
            {t("console.ai.agents.detail.promptHeading", undefined, "Prompt Template")}
          </h3>
          <pre className="mt-2 overflow-x-auto rounded text-xs whitespace-pre-wrap text-[var(--p-text-2)]">
            {agent.prompt_template}
          </pre>
        </section>

        <section className="surface p-4">
          <h3 className="text-sm font-semibold">
            {t("console.ai.agents.detail.sourceHeading", undefined, "Source Columns")}
          </h3>
          {agent.source_columns.length === 0 ? (
            <p className="mt-2 text-xs text-[var(--p-text-2)]">
              {t("console.ai.agents.detail.sourceEmpty", undefined, "None")}
            </p>
          ) : (
            <div className="mt-2 flex flex-wrap gap-2">
              {agent.source_columns.map((col) => (
                <Badge key={col} variant="muted">
                  {col}
                </Badge>
              ))}
            </div>
          )}
        </section>

        <section className="surface grid grid-cols-2 gap-3 p-4 text-xs">
          <div>
            <div className="text-[10px] tracking-wider text-[var(--p-text-2)] uppercase">
              {t("console.ai.agents.detail.createdBy", undefined, "Created By")}
            </div>
            <div className="mt-1">{createdByLabel ?? "—"}</div>
          </div>
          <div>
            <div className="text-[10px] tracking-wider text-[var(--p-text-2)] uppercase">
              {t("console.ai.agents.detail.createdAt", undefined, "Created")}
            </div>
            <div className="mt-1 font-mono">{fmt(agent.created_at)}</div>
          </div>
          <div>
            <div className="text-[10px] tracking-wider text-[var(--p-text-2)] uppercase">
              {t("console.ai.agents.detail.maxTokens", undefined, "Max Tokens")}
            </div>
            <div className="mt-1 font-mono">{agent.max_tokens}</div>
          </div>
          <div>
            <div className="text-[10px] tracking-wider text-[var(--p-text-2)] uppercase">
              {t("console.ai.agents.detail.autoRefresh", undefined, "Auto Refresh")}
            </div>
            <div className="mt-1">
              {agent.auto_refresh
                ? t("common.yes", undefined, "Yes")
                : t("common.no", undefined, "No")}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
