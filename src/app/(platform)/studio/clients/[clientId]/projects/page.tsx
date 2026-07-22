import { ModuleHeader } from "@/components/Shell";
import { DataView } from "@/components/views/DataViewServer";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { formatMoney } from "@/lib/i18n/format";
import { toTitle } from "@/lib/format";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  name: string;
  project_state: string;
  start_date: string | null;
  end_date: string | null;
  budget_cents: number | null;
};

export default async function Page({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = await params;
  if (!hasSupabase) return null;
  const { t } = await getRequestT();
  const session = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("projects")
    .select("id,name,project_state,start_date,end_date,budget_cents")
    .is("deleted_at", null)
    .eq("org_id", session.orgId)
    .eq("client_id", clientId)
    .order("start_date", { ascending: false, nullsFirst: false });
  const rows = (data ?? []) as Row[];

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.clients.projects.eyebrow", undefined, "Client")}
        title={t("console.clients.projects.title", undefined, "Projects")}
        subtitle={t("console.clients.projects.subtitle", undefined, "Projects linked to this client.")}
      />
      <div className="page-content">
        <DataView<Row>
          rows={rows}
          rowHref={(r) => `/studio/projects/${r.id}`}
          emptyLabel={t("console.clients.projects.emptyLabel", undefined, "No Projects")}
          emptyDescription={t(
            "console.clients.projects.emptyDescription",
            undefined,
            "No projects link to this client yet.",
          )}
          columns={[
            {
              key: "name",
              header: t("console.clients.projects.columns.name", undefined, "Name"),
              render: (r) => r.name,
              accessor: (r) => r.name,
              sortable: true,
            },
            {
              key: "project_state",
              header: t("console.clients.projects.columns.state", undefined, "State"),
              render: (r) => (
                <Badge variant={r.project_state === "active" ? "success" : "muted"}>{toTitle(r.project_state)}</Badge>
              ),
              accessor: (r) => r.project_state,
              filterable: true,
              groupable: true,
            },
            {
              key: "start_date",
              header: t("console.clients.projects.columns.start", undefined, "Start"),
              render: (r) => r.start_date ?? "—",
              accessor: (r) => r.start_date ?? "",
              mono: true,
              sortable: true,
            },
            {
              key: "end_date",
              header: t("console.clients.projects.columns.end", undefined, "End"),
              render: (r) => r.end_date ?? "—",
              accessor: (r) => r.end_date ?? "",
              mono: true,
              sortable: true,
            },
            {
              key: "budget_cents",
              header: t("console.clients.projects.columns.budget", undefined, "Budget"),
              render: (r) => (r.budget_cents != null ? formatMoney(r.budget_cents) : "—"),
              accessor: (r) => r.budget_cents ?? 0,
              numeric: true,
              sortable: true,
            },
          ]}
        />
      </div>
    </>
  );
}
