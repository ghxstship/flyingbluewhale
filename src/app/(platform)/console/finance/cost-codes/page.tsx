import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";

export const dynamic = "force-dynamic";

type Row = { id: string; code: string; name: string; description: string | null; active: boolean };

export default async function Page() {
  if (!hasSupabase) return null;
  const session = await requireSession();
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
        eyebrow="Finance"
        title="Cost Codes"
        subtitle="Master list. Time entries roll labor cost up to the cost code attached to a budget line."
        action={
          <Button href="/console/finance/cost-codes/new" size="sm">
            + New Cost Code
          </Button>
        }
      />
      <div className="page-content">
        <DataTable<Row>
          rows={rows}
          rowHref={(r) => `/console/finance/cost-codes/${r.id}`}
          emptyLabel="No cost codes"
          emptyDescription="Cost codes group labor and material spend (e.g. 02-100 Site Prep, 16-200 Lighting Install)."
          emptyAction={
            <Button href="/console/finance/cost-codes/new" size="sm">
              + New Cost Code
            </Button>
          }
          columns={[
            {
              key: "code",
              header: "Code",
              render: (r) => r.code,
              className: "font-mono text-xs",
              accessor: (r) => r.code,
            },
            { key: "name", header: "Name", render: (r) => r.name, accessor: (r) => r.name },
            {
              key: "desc",
              header: "Description",
              render: (r) => r.description ?? "—",
              accessor: (r) => r.description ?? null,
            },
            {
              key: "active",
              header: "",
              render: (r) => <Badge variant={r.active ? "success" : "muted"}>{r.active ? "active" : "archived"}</Badge>,
            },
          ]}
        />
      </div>
    </>
  );
}
