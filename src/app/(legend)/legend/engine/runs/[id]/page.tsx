import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { MetricCard } from "@/components/ui/MetricCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { AccessDenied } from "@/components/ui/AccessDenied";
import { requireSession, isManagerPlus } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { timeAgo } from "@/lib/format";
import { ConfigureSupabase } from "@/components/ui/ConfigureSupabase";
import type { LooseSupabase } from "@/lib/supabase/loose";
import {
  isFindingOutstanding,
  RUN_STATE_LABELS,
  SCOPE_KIND_LABELS,
  type ComplianceRunSummary,
  type ComplianceScopeKind,
} from "@/lib/xmce_engine";
import type { ComplianceFindingRow, ComplianceRuleRow, ComplianceRunRow } from "../../types";
import { FindingsTable, type FindingWithRule } from "./FindingsTable";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

export default async function RunDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.legend.engine.eyebrow", undefined, "LEG3ND · XMCE")}
          title={t("console.legend.engine.run.title", undefined, "Compliance Run")}
        />
        <ConfigureSupabase />
      </>
    );
  }
  const { id } = await params;
  const session = await requireSession();
  if (!isManagerPlus(session)) {
    return <AccessDenied requiredRole="Manager" backHref="/legend" />;
  }
  const db = (await createClient()) as unknown as LooseSupabase;

  const { data: runData } = await db
    .from("compliance_runs")
    .select("id, org_id, scope_kind, scope_ref, run_state, summary, started_at, finished_at, created_at, updated_at")
    .eq("id", id)
    .eq("org_id", session.orgId)
    .maybeSingle();
  const run = runData as ComplianceRunRow | null;
  if (!run) notFound();

  const { data: findingData } = await db
    .from("compliance_findings")
    .select("id, org_id, run_id, rule_id, finding_state, severity, detail, entity_ref, created_at, updated_at")
    .eq("org_id", session.orgId)
    .eq("run_id", id)
    .order("created_at", { ascending: false })
    .limit(500);
  const findings = (findingData ?? []) as ComplianceFindingRow[];

  // Hydrate rule code/title for each finding's rule_id.
  const ruleIds = Array.from(new Set(findings.map((f) => f.rule_id)));
  const ruleMap = new Map<string, { code: string; title: string }>();
  if (ruleIds.length > 0) {
    const { data: ruleData } = await db
      .from("compliance_rules")
      .select("id, code, title")
      .eq("org_id", session.orgId)
      .in("id", ruleIds);
    for (const r of (ruleData ?? []) as Pick<ComplianceRuleRow, "id" | "code" | "title">[]) {
      ruleMap.set(r.id, { code: r.code, title: r.title });
    }
  }
  const findingsWithRule: FindingWithRule[] = findings.map((f) => ({
    ...f,
    rule_code: ruleMap.get(f.rule_id)?.code ?? "—",
    rule_title: ruleMap.get(f.rule_id)?.title ?? "—",
  }));

  const summary = run.summary as Partial<ComplianceRunSummary> | null;
  const outstanding = findings.filter((f) => isFindingOutstanding(f.finding_state)).length;
  const scopeLabel = SCOPE_KIND_LABELS[run.scope_kind as ComplianceScopeKind] ?? run.scope_kind;

  return (
    <>
      <ModuleHeader
        eyebrow={`LEG3ND · XMCE · ${scopeLabel}`}
        title={t("console.legend.engine.run.heading", { state: RUN_STATE_LABELS[run.run_state] }, `Run · ${RUN_STATE_LABELS[run.run_state]}`)}
        subtitle={
          run.finished_at
            ? t("console.legend.engine.run.finishedAgo", { ago: timeAgo(run.finished_at) }, `Finished ${timeAgo(run.finished_at)}`)
            : t("console.legend.engine.run.startedAgo", { ago: timeAgo(run.created_at) }, `Started ${timeAgo(run.created_at)}`)
        }
        action={<StatusBadge status={run.run_state} />}
      />
      <div className="page-content space-y-6">
        <div className="metric-grid">
          <MetricCard
            label={t("console.legend.engine.run.rulesEvaluated", undefined, "Rules evaluated")}
            value={summary?.rules_evaluated ?? 0}
          />
          <MetricCard
            label={t("console.legend.engine.run.findings", undefined, "Findings")}
            value={summary?.findings_total ?? findings.length}
          />
          <MetricCard
            label={t("console.legend.engine.run.outstanding", undefined, "Outstanding")}
            value={outstanding}
            accent={outstanding > 0}
          />
          <MetricCard label={t("console.legend.engine.run.scope", undefined, "Scope")} value={scopeLabel} />
        </div>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-[var(--p-text-1)]">
            {t("console.legend.engine.run.findings", undefined, "Findings")}
          </h2>
          {findingsWithRule.length === 0 ? (
            <EmptyState
              title={t("console.legend.engine.run.noFindingsTitle", undefined, "No findings")}
              description={t(
                "console.legend.engine.run.noFindingsDescription",
                undefined,
                "This run passed clean. No active rules were tripped for the selected scope.",
              )}
            />
          ) : (
            <FindingsTable runId={run.id} findings={findingsWithRule} />
          )}
        </section>
      </div>
    </>
  );
}
