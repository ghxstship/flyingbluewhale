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
  const session = await requireSession();
  const { t } = await getRequestT();
  const supabase = await createClient();
  const { data } = await supabase
    .from("cost_codes")
    .select("id, code, name, description, active")
    .eq("org_id", session.orgId)
    .order("code");
  const rows = (data ?? []) as unknown as Row[];

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.finance.costCodes.eyebrow", undefined, "Finance")}
        title={t("console.finance.costCodes.title", undefined, "Cost Codes")}
        subtitle={t("console.finance.costCodes.subtitle", undefined, "Master cost-code list.")}
        action={
          <Button href="/console/finance/cost-codes/new" size="sm">
            {t("console.finance.costCodes.newCta", undefined, "+ New Cost Code")}
          </Button>
        }
      />
      <div className="page-content">
        <DataTable<Row>
          rows={rows}
          rowHref={(r) => `/console/finance/cost-codes/${r.id}`}
          emptyLabel={t("console.finance.costCodes.emptyLabel", undefined, "No cost codes")}
          emptyDescription={t(
            "console.finance.costCodes.emptyDescription",
            undefined,
            "Cost codes group labor and material spend (e.g. 02-100 Site Prep, 16-200 Lighting Install).",
          )}
          emptyAction={
            <Button href="/console/finance/cost-codes/new" size="sm">
              {t("console.finance.costCodes.newCta", undefined, "+ New Cost Code")}
            </Button>
          }
          columns={[
            {
              key: "code",
              header: t("console.finance.costCodes.col.code", undefined, "Code"),
              render: (r) => r.code,
              className: "font-mono text-xs",
              accessor: (r) => r.code,
            },
            {
              key: "name",
              header: t("console.finance.costCodes.col.name", undefined, "Name"),
              render: (r) => r.name,
              accessor: (r) => r.name,
            },
            {
              key: "desc",
              header: t("console.finance.costCodes.col.description", undefined, "Description"),
              render: (r) => r.description ?? "—",
              accessor: (r) => r.description ?? null,
            },
            {
              key: "active",
              header: "",
              render: (r) => (
                <Badge variant={r.active ? "success" : "muted"}>
                  {r.active
                    ? t("console.finance.costCodes.badge.active", undefined, "active")
                    : t("console.finance.costCodes.badge.archived", undefined, "archived")}
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
