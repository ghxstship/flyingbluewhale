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
    .from("prequalification_questionnaires")
    .select("id, code, name, description, active")
    .eq("org_id", session.orgId)
    .order("created_at", { ascending: false });
  const rows = (data ?? []) as unknown as Row[];

  return (
    <>
      <ModuleHeader
        eyebrow="Procurement"
        breadcrumbs={[
          { label: "Prequalification", href: "/console/procurement/prequalification" },
          { label: "Questionnaires" },
        ]}
        title="Prequal Questionnaires"
        action={
          <Button href="/console/procurement/prequalification/questionnaires/new" size="sm">
            + New Questionnaire
          </Button>
        }
      />
      <div className="page-content">
        <DataTable<Row>
          rows={rows}
          rowHref={(r) => `/console/procurement/prequalification/questionnaires/${r.id}`}
          emptyLabel="No questionnaires"
          emptyAction={
            <Button href="/console/procurement/prequalification/questionnaires/new" size="sm">
              + New Questionnaire
            </Button>
          }
          columns={[
            { key: "code", header: "Code", render: (r) => r.code, className: "font-mono text-xs" },
            { key: "name", header: "Name", render: (r) => r.name },
            { key: "desc", header: "Description", render: (r) => r.description ?? "—" },
            {
              key: "active",
              header: "Status",
              render: (r) => <Badge variant={r.active ? "success" : "muted"}>{r.active ? "active" : "archived"}</Badge>,
            },
          ]}
        />
      </div>
    </>
  );
}
