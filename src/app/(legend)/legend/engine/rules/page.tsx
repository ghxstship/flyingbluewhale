import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataView } from "@/components/views/DataViewServer";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { AccessDenied } from "@/components/ui/AccessDenied";
import { requireSession, isManagerPlus } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { timeAgo } from "@/lib/format";
import { ConfigureSupabase } from "@/components/ui/ConfigureSupabase";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { SEVERITY_LABELS } from "@/lib/xmce_engine";
import type { ComplianceRuleRow } from "../types";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

export default async function RulesPage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.legend.engine.eyebrow", undefined, "LEG3ND · XMCE")}
          title={t("console.legend.engine.rulesTitle", undefined, "Compliance Rules")}
        />
        <ConfigureSupabase />
      </>
    );
  }
  const session = await requireSession();
  if (!isManagerPlus(session)) {
    return <AccessDenied requiredRole="Manager" backHref="/legend" />;
  }
  const db = (await createClient()) as unknown as LooseSupabase;
  const { data } = await db
    .from("compliance_rules")
    .select("id, org_id, code, title, description, severity, category, rule_state, created_at, updated_at, deleted_at")
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(200);
  const rows = (data ?? []) as ComplianceRuleRow[];

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.legend.engine.eyebrow", undefined, "LEG3ND · XMCE")}
        title={t("console.legend.engine.rulesTitle", undefined, "Compliance Rules")}
        subtitle={
          rows.length === 1
            ? t("console.legend.engine.oneRule", undefined, "1 rule")
            : t("console.legend.engine.nRules", { count: rows.length }, `${rows.length} rules`)
        }
        action={<Button href="/legend/engine/rules/new">{t("console.legend.engine.newRule", undefined, "+ New Rule")}</Button>}
      />
      <div className="page-content">
        <DataView<ComplianceRuleRow>
          rows={rows}
          rowHref={(r) => `/legend/engine/rules/${r.id}`}
          emptyLabel={t("console.legend.engine.noRulesTitle", undefined, "No compliance rules yet")}
          emptyDescription={t(
            "console.legend.engine.noRulesDescription",
            undefined,
            "Author your first rule to start running compliance checks.",
          )}
          emptyAction={<Button href="/legend/engine/rules/new">{t("console.legend.engine.newRule", undefined, "+ New Rule")}</Button>}
          columns={[
            {
              key: "code",
              header: t("console.legend.engine.columns.code", undefined, "Code"),
              mono: true,
              render: (r) => r.code,
              accessor: (r) => r.code,
            },
            {
              key: "title",
              header: t("console.legend.engine.columns.title", undefined, "Title"),
              render: (r) => r.title,
              accessor: (r) => r.title,
            },
            {
              key: "severity",
              header: t("console.legend.engine.columns.severity", undefined, "Severity"),
              sortable: true,
              filterable: true,
              render: (r) => <StatusBadge status={r.severity} />,
              accessor: (r) => SEVERITY_LABELS[r.severity],
            },
            {
              key: "category",
              header: t("console.legend.engine.columns.category", undefined, "Category"),
              filterable: true,
              render: (r) => r.category ?? "—",
              accessor: (r) => r.category ?? null,
            },
            {
              key: "rule_state",
              header: t("console.legend.engine.columns.status", undefined, "Status"),
              filterable: true,
              render: (r) => <StatusBadge status={r.rule_state} />,
              accessor: (r) => r.rule_state,
            },
            {
              key: "created",
              header: t("console.legend.engine.columns.added", undefined, "Added"),
              sortable: true,
              render: (r) => timeAgo(r.created_at),
              accessor: (r) => r.created_at,
            },
          ]}
        />
      </div>
    </>
  );
}
