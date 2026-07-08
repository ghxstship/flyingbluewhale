import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
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

export const dynamic = "force-dynamic";

export default async function RulesPage() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="LEG3ND · XMCE" title="Compliance Rules" />
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
        eyebrow="LEG3ND · XMCE"
        title="Compliance Rules"
        subtitle={rows.length === 1 ? "1 rule" : `${rows.length} rules`}
        action={<Button href="/legend/engine/rules/new">+ New Rule</Button>}
      />
      <div className="page-content">
        <DataTable<ComplianceRuleRow>
          rows={rows}
          rowHref={(r) => `/legend/engine/rules/${r.id}`}
          emptyLabel="No compliance rules yet"
          emptyDescription="Author your first rule to start running compliance checks."
          emptyAction={<Button href="/legend/engine/rules/new">+ New Rule</Button>}
          columns={[
            {
              key: "code",
              header: "Code",
              mono: true,
              render: (r) => r.code,
              accessor: (r) => r.code,
            },
            {
              key: "title",
              header: "Title",
              render: (r) => r.title,
              accessor: (r) => r.title,
            },
            {
              key: "severity",
              header: "Severity",
              sortable: true,
              filterable: true,
              render: (r) => <StatusBadge status={r.severity} />,
              accessor: (r) => SEVERITY_LABELS[r.severity],
            },
            {
              key: "category",
              header: "Category",
              filterable: true,
              render: (r) => r.category ?? "—",
              accessor: (r) => r.category ?? null,
            },
            {
              key: "rule_state",
              header: "State",
              filterable: true,
              render: (r) => <StatusBadge status={r.rule_state} />,
              accessor: (r) => r.rule_state,
            },
            {
              key: "created",
              header: "Added",
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
