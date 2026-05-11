import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/DataTable";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  name: string;
  description: string | null;
  target_role: string | null;
  publish_state: string;
  created_at: string;
};

export default async function Page() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Workforce" title="Onboarding" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("new_hire_flows")
    .select("id, name, description, target_role, publish_state, created_at")
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(200);
  const rows = (data ?? []) as Row[];

  return (
    <>
      <ModuleHeader
        eyebrow="Workforce"
        title="Onboarding"
        subtitle={`${rows.length} flow${rows.length === 1 ? "" : "s"} · new-hire journeys for /m/onboarding`}
        action={
          <Button href="/console/workforce/onboarding/new" size="sm">
            + New Flow
          </Button>
        }
      />
      <div className="page-content">
        <DataTable<Row>
          rows={rows}
          rowHref={(r) => `/console/workforce/onboarding/${r.id}`}
          emptyLabel="No flows yet"
          emptyDescription="Build a step-by-step new-hire journey: read SOPs, sign forms, complete courses. Assignees see it on /m/onboarding."
          columns={[
            { key: "name", header: "Name", render: (r) => r.name },
            {
              key: "publish_state",
              header: "State",
              render: (r) => (
                <Badge
                  variant={
                    r.publish_state === "published" ? "success" : r.publish_state === "archived" ? "muted" : "info"
                  }
                >
                  {r.publish_state}
                </Badge>
              ),
            },
            { key: "target_role", header: "Role", render: (r) => r.target_role ?? "—" },
          ]}
        />
      </div>
    </>
  );
}
