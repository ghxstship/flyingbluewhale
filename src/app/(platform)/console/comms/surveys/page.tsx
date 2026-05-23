import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/DataTable";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { toTitle } from "@/lib/format";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  title: string;
  publish_state: string;
  audience: string;
  anonymous: boolean;
  closes_at: string | null;
  created_at: string;
};

export default async function Page() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Comms" title="Surveys" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("surveys")
    .select("id, title, publish_state, audience, anonymous, closes_at, created_at")
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(200);
  const rows = (data ?? []) as Row[];

  return (
    <>
      <ModuleHeader
        eyebrow="Comms"
        title="Surveys"
        subtitle={`${rows.length} survey${rows.length === 1 ? "" : "s"}`}
        action={
          <Button href="/console/comms/surveys/new" size="sm">
            + New Survey
          </Button>
        }
      />
      <div className="page-content">
        <DataTable<Row>
          rows={rows}
          rowHref={(r) => `/console/comms/surveys/${r.id}`}
          emptyLabel="No surveys yet"
          emptyDescription="Pulse, eNPS, and suggestion-box surveys. Anonymous mode strips respondent_id."
          columns={[
            { key: "title", header: "Title", render: (r) => r.title },
            {
              key: "publish_state",
              header: "State",
              render: (r) => (
                <Badge
                  variant={
                    r.publish_state === "published" ? "success" : r.publish_state === "closed" ? "muted" : "info"
                  }
                >
                  {r.publish_state}
                </Badge>
              ),
            },
            {
              key: "audience",
              header: "Audience",
              render: (r) => <Badge variant="muted">{toTitle(r.audience)}</Badge>,
            },
            { key: "anonymous", header: "Anon", render: (r) => (r.anonymous ? "Yes" : "—") },
          ]}
        />
      </div>
    </>
  );
}
