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
  question: string;
  publish_state: string;
  audience: string;
  closes_at: string | null;
  created_at: string;
};

export default async function Page() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Comms" title="Polls" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("polls")
    .select("id, question, publish_state, audience, closes_at, created_at")
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(200);
  const rows = (data ?? []) as Row[];

  return (
    <>
      <ModuleHeader
        eyebrow="Comms"
        title="Polls"
        subtitle={`${rows.length} poll${rows.length === 1 ? "" : "s"}`}
        action={
          <Button href="/console/comms/polls/new" size="sm">
            + New Poll
          </Button>
        }
      />
      <div className="page-content">
        <DataTable<Row>
          rows={rows}
          rowHref={(r) => `/console/comms/polls/${r.id}`}
          emptyLabel="No polls yet"
          emptyDescription="Quick one-question polls. Crews vote from /m/polls; results aggregate here."
          columns={[
            { key: "question", header: "Question", render: (r) => r.question },
            {
              key: "publish_state",
              header: "State",
              render: (r) => (
                <Badge
                  variant={r.publish_state === "live" ? "success" : r.publish_state === "closed" ? "muted" : "info"}
                >
                  {r.publish_state}
                </Badge>
              ),
            },
            { key: "audience", header: "Audience", render: (r) => <Badge variant="muted">{r.audience}</Badge> },
          ]}
        />
      </div>
    </>
  );
}
