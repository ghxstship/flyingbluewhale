import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { formatMoney } from "@/lib/i18n/format";
import { timeAgo } from "@/lib/format";
import { getRequestT } from "@/lib/i18n/request";
import type { Lead } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

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
  const rows = await listOrgScoped("leads", session.orgId, { orderBy: "updated_at" });

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.leads.eyebrow", undefined, "Sales")}
        title={t("console.leads.title", undefined, "Leads")}
        subtitle={
          rows.length === 1
            ? t("console.leads.subtitle.one", { count: rows.length }, `${rows.length} Lead`)
            : t("console.leads.subtitle.other", { count: rows.length }, `${rows.length} Leads`)
        }
        action={<Button href="/console/leads/new">{t("console.leads.newLead", undefined, "+ New Lead")}</Button>}
      />
      <div className="page-content">
        <DataTable<Lead>
          rows={rows}
          rowHref={(row) => `/console/leads/${row.id}`}
          columns={[
            {
              key: "name",
              header: t("console.leads.columns.name", undefined, "Name"),
              render: (row) => row.name,
              accessor: (row) => row.name,
            },
            {
              key: "stage",
              header: t("console.leads.columns.stage", undefined, "Stage"),
              render: (row) => <StatusBadge status={row.stage} />,
              accessor: (row) => row.stage,
              filterable: true,
              groupable: true,
            },
            {
              key: "value",
              header: t("console.leads.columns.value", undefined, "Value"),
              render: (row) => formatMoney(row.estimated_value_cents),
              className: "font-mono text-xs",
              accessor: (row) => Number(row.estimated_value_cents ?? 0),
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
              render: (row) => row.email ?? "—",
              className: "font-mono text-xs",
              accessor: (row) => row.email ?? null,
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
