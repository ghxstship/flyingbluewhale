import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { AccessDenied } from "@/components/ui/AccessDenied";
import { requireSession, isManagerPlus } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { timeAgo } from "@/lib/format";
import { ConfigureSupabase } from "@/components/ui/ConfigureSupabase";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { isFindingOutstanding } from "@/lib/xmce_engine";
import type { ComplianceFindingRow, ComplianceRuleRow } from "../../types";
import { DeleteRuleButton } from "./DeleteRuleButton";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

export default async function RuleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.legend.engine.eyebrow", undefined, "LEG3ND · XMCE")}
          title={t("console.legend.engine.rule.title", undefined, "Compliance Rule")}
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

  const { data: ruleData } = await db
    .from("compliance_rules")
    .select("id, org_id, code, title, description, severity, category, rule_state, created_at, updated_at, deleted_at")
    .eq("id", id)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  const rule = ruleData as ComplianceRuleRow | null;
  if (!rule) notFound();

  const { data: findingData } = await db
    .from("compliance_findings")
    .select("id, org_id, run_id, rule_id, finding_state, severity, detail, entity_ref, created_at, updated_at")
    .eq("org_id", session.orgId)
    .eq("rule_id", id)
    .order("created_at", { ascending: false })
    .limit(50);
  const findings = (findingData ?? []) as ComplianceFindingRow[];
  const outstanding = findings.filter((f) => isFindingOutstanding(f.finding_state)).length;

  return (
    <>
      <ModuleHeader
        eyebrow={rule.code}
        title={rule.title}
        subtitle={rule.category ?? undefined}
        action={
          <div className="flex items-center gap-2">
            <StatusBadge status={rule.severity} />
            <StatusBadge status={rule.rule_state} />
            <Button href={`/legend/engine/rules/${rule.id}/edit`} variant="secondary">
              {t("console.legend.engine.rule.edit", undefined, "Edit")}
            </Button>
          </div>
        }
      />
      <div className="page-content max-w-3xl space-y-6">
        <section className="surface space-y-3 p-5">
          <Field label={t("console.legend.engine.rule.description", undefined, "Description")}>
            {rule.description || "—"}
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label={t("console.legend.engine.rule.severity", undefined, "Severity")}>
              <StatusBadge status={rule.severity} />
            </Field>
            <Field label={t("console.legend.engine.rule.status", undefined, "Status")}>
              <StatusBadge status={rule.rule_state} />
            </Field>
            <Field label={t("console.legend.engine.rule.added", undefined, "Added")}>{timeAgo(rule.created_at)}</Field>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-[var(--p-text-1)]">
            {t("console.legend.engine.rule.findings", undefined, "Findings")}{" "}
            {findings.length > 0
              ? t("console.legend.engine.rule.outstandingCount", { count: outstanding }, `(${outstanding} outstanding)`)
              : ""}
          </h2>
          {findings.length === 0 ? (
            <EmptyState
              size="compact"
              title={t("console.legend.engine.rule.noFindingsTitle", undefined, "No findings for this rule")}
              description={t(
                "console.legend.engine.rule.noFindingsDescription",
                undefined,
                "Findings appear here after a compliance run trips this rule.",
              )}
            />
          ) : (
            <div className="surface divide-y divide-[var(--p-border)]">
              {findings.map((f) => (
                <a
                  key={f.id}
                  href={`/legend/engine/runs/${f.run_id}`}
                  className="hover-lift flex items-center justify-between gap-3 p-3"
                >
                  <div className="min-w-0">
                    <div className="text-sm text-[var(--p-text-1)]">{f.detail ?? "—"}</div>
                    <div className="text-xs text-[var(--p-text-2)]">
                      {f.entity_ref ?? "—"} · {timeAgo(f.created_at)}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <StatusBadge status={f.severity} />
                    <StatusBadge status={f.finding_state} />
                  </div>
                </a>
              ))}
            </div>
          )}
        </section>

        <section className="surface flex items-center justify-between gap-3 p-4">
          <div>
            <div className="text-sm font-medium text-[var(--p-text-1)]">
              {t("console.legend.engine.rule.deleteRule", undefined, "Delete rule")}
            </div>
            <div className="text-xs text-[var(--p-text-2)]">
              {t("console.legend.engine.rule.deleteHint", undefined, "Soft-deletes the rule. Past findings are retained.")}
            </div>
          </div>
          <DeleteRuleButton ruleId={rule.id} />
        </section>
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <div className="eyebrow">{label}</div>
      <div className="text-sm text-[var(--p-text-1)]">{children}</div>
    </div>
  );
}
