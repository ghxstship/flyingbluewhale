import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

type Row = { id: string; code: string; name: string; description: string | null; active: boolean };

export default async function Page() {
  if (!hasSupabase) return null;
  const { t } = await getRequestT();
  const session = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("prequalification_questionnaires")
    .select("id, code, name, description, active")
    .eq("org_id", session.orgId)
    .order("created_at", { ascending: false });
  const rows = (data ?? []) as unknown as Row[];

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.procurement.eyebrow", undefined, "Procurement")}
        breadcrumbs={[
          {
            label: t("console.procurement.prequalification.breadcrumb", undefined, "Prequalification"),
            href: "/studio/procurement/prequalification",
          },
          { label: t("console.procurement.prequalification.questionnaires.breadcrumb", undefined, "Questionnaires") },
        ]}
        title={t("console.procurement.prequalification.questionnaires.title", undefined, "Prequal Questionnaires")}
        action={
          <Button href="/studio/procurement/prequalification/questionnaires/new" size="sm">
            {t("console.procurement.prequalification.questionnaires.newAction", undefined, "+ New Questionnaire")}
          </Button>
        }
      />
      <div className="page-content">
        <DataTable<Row>
          rows={rows}
          /* No per-row detail route exists yet (only list/new). Rows were
             linking to /questionnaires/[id], which 404s. Keep rows static
             until the detail page is built. */
          emptyLabel={t("console.procurement.prequalification.questionnaires.empty", undefined, "No questionnaires")}
          emptyAction={
            <Button href="/studio/procurement/prequalification/questionnaires/new" size="sm">
              {t("console.procurement.prequalification.questionnaires.newAction", undefined, "+ New Questionnaire")}
            </Button>
          }
          columns={[
            {
              key: "code",
              header: t("console.procurement.prequalification.questionnaires.columns.code", undefined, "Code"),
              render: (r) => r.code,
              className: "font-mono text-xs",
              accessor: (r) => r.code,
            },
            {
              key: "name",
              header: t("console.procurement.prequalification.questionnaires.columns.name", undefined, "Name"),
              render: (r) => r.name,
              accessor: (r) => r.name,
            },
            {
              key: "desc",
              header: t(
                "console.procurement.prequalification.questionnaires.columns.description",
                undefined,
                "Description",
              ),
              render: (r) => r.description ?? "—",
              accessor: (r) => r.description ?? null,
            },
            {
              key: "active",
              header: t("console.procurement.prequalification.questionnaires.columns.status", undefined, "Status"),
              render: (r) => (
                <Badge variant={r.active ? "success" : "muted"}>
                  {r.active
                    ? t("console.procurement.prequalification.questionnaires.statusActive", undefined, "active")
                    : t("console.procurement.prequalification.questionnaires.statusArchived", undefined, "archived")}
                </Badge>
              ),
              accessor: (r) => r.active ?? null,
            },
          ]}
        />
      </div>
    </>
  );
}
