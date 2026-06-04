import { ModuleHeader } from "@/components/Shell";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { formatMoney } from "@/lib/i18n/format";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  name: string;
  role: string | null;
  day_rate_cents: number | null;
  phone: string | null;
  email: string | null;
  user_id: string | null;
};

export default async function Page({ params }: { params: Promise<{ personId: string }> }) {
  const { personId } = await params;
  if (!hasSupabase) return null;
  const { t } = await getRequestT();
  const session = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("crew_members")
    .select("id,name,role,day_rate_cents,phone,email,user_id")
    .eq("org_id", session.orgId)
    .eq("user_id", personId);
  const rows = (data ?? []) as Row[];

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.people.assignments.eyebrow", undefined, "Person")}
        title={t("console.people.assignments.title", undefined, "Assignments")}
        subtitle={t("console.people.assignments.subtitle", undefined, "Crew records linked to this person.")}
      />
      <div className="page-content">
        <DataTable<Row>
          rows={rows}
          emptyLabel={t("console.people.assignments.emptyLabel", undefined, "No Assignments")}
          emptyDescription={t(
            "console.people.assignments.emptyDescription",
            undefined,
            "This person has no crew records yet. Assignments link a person to project crew slots — create one from the Crew register.",
          )}
          columns={[
            {
              key: "role",
              header: t("console.people.assignments.columns.role", undefined, "Role"),
              render: (r) => (r.role ? <Badge variant="brand">{r.role}</Badge> : "—"),
              accessor: (r) => r.role ?? "",
              filterable: true,
              groupable: true,
            },
            {
              key: "name",
              header: t("console.people.assignments.columns.name", undefined, "Name"),
              render: (r) => r.name,
              accessor: (r) => r.name,
              sortable: true,
            },
            {
              key: "day_rate_cents",
              header: t("console.people.assignments.columns.dayRate", undefined, "Day Rate"),
              render: (r) => (r.day_rate_cents != null ? formatMoney(r.day_rate_cents) : "—"),
              accessor: (r) => r.day_rate_cents ?? 0,
              tabular: true,
              sortable: true,
              className: "text-right",
              headerClassName: "text-right",
            },
            {
              key: "contact",
              header: t("console.people.assignments.columns.contact", undefined, "Contact"),
              render: (r) => r.email ?? r.phone ?? "—",
              accessor: (r) => r.email ?? r.phone ?? "",
              mono: true,
            },
          ]}
        />
      </div>
    </>
  );
}
