import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/i18n/format";
import { timeAgo } from "@/lib/format";
import { getRequestT } from "@/lib/i18n/request";
import type { CrmRecord } from "@/lib/supabase/types";
import { bulkLoseLeads, bulkQualifyLeads, editLeadCell } from "./actions";

export const dynamic = "force-dynamic";

// Filtered lens over the merged CRM store (opportunities, kind='lead') —
// kit v7.8 §09 C-11 / ADR-0014 Phase A amendment. The canonical unfiltered
// surface is /studio/crm.
export default async function LeadsPage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader title={t("console.leads.title", undefined, "Leads")} />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.leads.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  // Exact kind-filtered count alongside the capped table page (audit
  // A-05/A-07) — subtitle and truncation indicator stay honest past the
  // 100-row cap. countOrgScoped can't carry the kind filter, so this is a
  // narrow head-only count.
  const [rows, { count }] = await Promise.all([
    listOrgScoped("opportunities", session.orgId, {
      orderBy: "updated_at",
      filters: [{ column: "kind", op: "eq", value: "lead" }],
    }) as unknown as Promise<CrmRecord[]>,
    supabase
      .from("opportunities")
      .select("*", { count: "exact", head: true })
      .eq("org_id", session.orgId)
      .eq("kind", "lead"),
  ]);
  const totalCount = count ?? rows.length;

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.leads.eyebrow", undefined, "Sales")}
        title={t("console.leads.title", undefined, "Leads")}
        subtitle={
          totalCount === 1
            ? t("console.leads.subtitle.one", { count: totalCount }, `${totalCount} Lead`)
            : t("console.leads.subtitle.other", { count: totalCount }, `${totalCount} Leads`)
        }
        action={<Button href="/studio/leads/new">{t("console.leads.newLead", undefined, "+ New Lead")}</Button>}
      />
      <div className="page-content">
        <DataTable<CrmRecord>
          rows={rows}
          totalCount={totalCount}
          rowHref={(row) => `/studio/leads/${row.id}`}
          emptyLabel={t("console.leads.emptyLabel", undefined, "No leads yet")}
          emptyDescription={t(
            "console.leads.emptyDescription",
            undefined,
            "Log an inbound inquiry or prospect; qualified leads convert to proposals and deals.",
          )}
          emptyAction={
            <Button href="/studio/leads/new" size="sm">
              {t("console.leads.newLead", undefined, "+ New Lead")}
            </Button>
          }
          bulkActions={[
            {
              id: "qualify",
              label: t("console.leads.bulk.qualify", undefined, "Mark Qualified"),
              perform: bulkQualifyLeads,
            },
            {
              id: "lose",
              label: t("console.leads.bulk.lose", undefined, "Mark Lost"),
              variant: "danger",
              perform: bulkLoseLeads,
            },
          ]}
          onCellEdit={editLeadCell}
          columns={[
            {
              key: "name",
              header: t("console.leads.columns.name", undefined, "Name"),
              render: (row) => row.title,
              accessor: (row) => row.title,
              editable: true,
            },
            {
              key: "stage",
              header: t("console.leads.columns.stage", undefined, "Stage"),
              render: (row) => <StatusBadge status={row.lead_phase ?? "new"} />,
              accessor: (row) => row.lead_phase ?? "new",
              filterable: true,
              groupable: true,
              editable: true,
            },
            {
              key: "value",
              header: t("console.leads.columns.value", undefined, "Value"),
              render: (row) => formatMoney(row.estimated_value_minor),
              className: "font-mono text-xs",
              accessor: (row) => Number(row.estimated_value_minor ?? 0),
            },
            {
              key: "source",
              header: t("console.leads.columns.source", undefined, "Source"),
              render: (row) => row.source ?? "—",
              className: "font-mono text-xs",
              accessor: (row) => row.source ?? null,
              filterable: true,
              groupable: true,
            },
            {
              key: "email",
              header: t("console.leads.columns.email", undefined, "Email"),
              render: (row) => row.contact_email ?? "—",
              className: "font-mono text-xs",
              accessor: (row) => row.contact_email ?? null,
            },
            {
              key: "updated",
              header: t("console.leads.columns.updated", undefined, "Updated"),
              render: (row) => timeAgo(row.updated_at),
              className: "font-mono text-xs",
              accessor: (row) => row.updated_at,
            },
          ]}
        />
      </div>
    </>
  );
}
