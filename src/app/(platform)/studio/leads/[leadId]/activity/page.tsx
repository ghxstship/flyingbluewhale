import { ModuleHeader } from "@/components/Shell";
import { DataTable } from "@/components/DataTable";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { formatDate } from "@/lib/i18n/format";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  actor_id: string | null;
  action: string;
  metadata: unknown;
  at: string;
};

export default async function Page({ params }: { params: Promise<{ leadId: string }> }) {
  const { leadId } = await params;
  if (!hasSupabase) return null;
  const session = await requireSession();
  const { t } = await getRequestT();
  const supabase = await createClient();
  const { data } = await supabase
    .from("audit_log")
    .select("id,actor_id,action,metadata,at")
    .eq("org_id", session.orgId)
    .eq("target_table", "leads")
    .eq("target_id", leadId)
    .order("at", { ascending: false })
    .limit(100);
  const rows = (data ?? []) as Row[];

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.leads.activity.eyebrow", undefined, "Lead")}
        title={t("console.leads.activity.title", undefined, "Activity")}
        subtitle={t("console.leads.activity.subtitle", undefined, "Audit trail for this lead.")}
      />
      <div className="page-content">
        <DataTable<Row>
          rows={rows}
          emptyLabel={t("console.leads.activity.emptyLabel", undefined, "No Activity Yet")}
          emptyDescription={t(
            "console.leads.activity.emptyDescription",
            undefined,
            "Audit log entries appear here as the lead moves through stages or is edited.",
          )}
          columns={[
            {
              key: "at",
              header: t("console.leads.activity.col.when", undefined, "When"),
              render: (row) => formatDate(row.at),
              accessor: (row) => row.at,
              mono: true,
              sortable: true,
            },
            {
              key: "action",
              header: t("console.leads.activity.col.action", undefined, "Action"),
              render: (row) => row.action,
              accessor: (row) => row.action,
              mono: true,
              filterable: true,
            },
            {
              key: "actor_id",
              header: t("console.leads.activity.col.actor", undefined, "Actor"),
              render: (row) => row.actor_id ?? t("console.leads.activity.systemActor", undefined, "system"),
              accessor: (row) => row.actor_id ?? "system",
              mono: true,
            },
          ]}
        />
      </div>
    </>
  );
}
