import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { formatMoney } from "@/lib/i18n/format";
import { timeAgo } from "@/lib/format";
import { getRequestT } from "@/lib/i18n/request";
import type { CrmRecordKind } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

// Canonical CRM surface — the ONE pursuit store (kit v7.8 §09 C-11,
// ADR-0014 Phase A amendment). Every deal, lead, and RFP is a row in
// `opportunities` discriminated by the `kind` facet; /studio/leads and
// /studio/pipeline are filtered lenses over this store.

type CrmRow = {
  id: string;
  kind: CrmRecordKind;
  title: string;
  lead_phase: string | null;
  estimated_value_minor: number | null;
  estimated_value_currency: string | null;
  source: string | null;
  contact_email: string | null;
  updated_at: string;
  stage: { name: string } | null;
};

const KIND_LABEL: Record<CrmRecordKind, string> = { deal: "Deal", lead: "Lead", rfp: "RFP" };
const KIND_VARIANT: Record<CrmRecordKind, BadgeVariant> = { deal: "info", lead: "muted", rfp: "warning" };

export default async function CrmPage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader title={t("console.crm.title", undefined, "Sales & CRM")} />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.crm.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("opportunities")
    .select(
      "id, kind, title, lead_phase, estimated_value_minor, estimated_value_currency, source, contact_email, updated_at, stage:current_stage_id(name)",
    )
    .eq("org_id", session.orgId)
    .order("updated_at", { ascending: false })
    .limit(500);
  const rows = (data ?? []) as unknown as CrmRow[];
  const deals = rows.filter((r) => r.kind === "deal").length;
  const leads = rows.filter((r) => r.kind === "lead").length;

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.crm.eyebrow", undefined, "Sales")}
        title={t("console.crm.title", undefined, "Sales & CRM")}
        subtitle={t(
          "console.crm.subtitle",
          { count: rows.length, deals, leads },
          `${rows.length} Pursuits · ${deals} Deals · ${leads} Leads`,
        )}
        action={<Button href="/studio/leads/new">{t("console.crm.newLead", undefined, "+ New Lead")}</Button>}
      />
      <div className="page-content">
        <DataTable<CrmRow>
          rows={rows}
          rowHref={(row) => (row.kind === "lead" ? `/studio/leads/${row.id}` : `/studio/pipeline/${row.id}`)}
          columns={[
            {
              key: "title",
              header: t("console.crm.columns.name", undefined, "Name"),
              render: (row) => row.title,
              accessor: (row) => row.title,
            },
            {
              key: "kind",
              header: t("console.crm.columns.kind", undefined, "Kind"),
              render: (row) => <Badge variant={KIND_VARIANT[row.kind]}>{KIND_LABEL[row.kind]}</Badge>,
              accessor: (row) => KIND_LABEL[row.kind],
              filterable: true,
              groupable: true,
            },
            {
              key: "stage",
              header: t("console.crm.columns.stage", undefined, "Stage"),
              render: (row) =>
                row.kind === "lead" ? <StatusBadge status={row.lead_phase ?? "new"} /> : (row.stage?.name ?? "—"),
              accessor: (row) => (row.kind === "lead" ? (row.lead_phase ?? "new") : (row.stage?.name ?? null)),
              filterable: true,
              groupable: true,
            },
            {
              key: "value",
              header: t("console.crm.columns.value", undefined, "Value"),
              render: (row) => formatMoney(row.estimated_value_minor, row.estimated_value_currency ?? undefined),
              className: "font-mono text-xs",
              accessor: (row) => Number(row.estimated_value_minor ?? 0),
            },
            {
              key: "source",
              header: t("console.crm.columns.source", undefined, "Source"),
              render: (row) => row.source ?? "—",
              className: "font-mono text-xs",
              accessor: (row) => row.source ?? null,
              filterable: true,
            },
            {
              key: "updated",
              header: t("console.crm.columns.updated", undefined, "Updated"),
              render: (row) => timeAgo(row.updated_at),
              className: "font-mono text-xs",
              accessor: (row) => row.updated_at,
            },
          ]}
          emptyLabel={t("console.crm.emptyLabel", undefined, "No Pursuits Yet")}
        />
      </div>
    </>
  );
}
