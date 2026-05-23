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
  audience: string;
  publish_state: string;
  pinned: boolean;
  published_at: string | null;
  created_at: string;
};

export default async function AnnouncementsPage() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Comms" title="Announcements" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("announcements")
    .select("id, title, audience, publish_state, pinned, published_at, created_at")
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(500);
  const rows = (data ?? []) as Row[];

  return (
    <>
      <ModuleHeader
        eyebrow="Comms"
        title="Announcements"
        subtitle={`${rows.length} announcement${rows.length === 1 ? "" : "s"}`}
        action={
          <Button href="/console/comms/announcements/new" size="sm">
            + New
          </Button>
        }
      />
      <div className="page-content">
        <DataTable<Row>
          rows={rows}
          rowHref={(r) => `/console/comms/announcements/${r.id}`}
          emptyLabel="No announcements yet"
          emptyDescription="Push org-wide updates to crew, contractors, vendors, or admins. They land in COMPVSS /m/feed."
          columns={[
            { key: "title", header: "Title", render: (r) => r.title },
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
            {
              key: "audience",
              header: "Audience",
              render: (r) => <Badge variant="muted">{toTitle(r.audience)}</Badge>,
            },
            { key: "pinned", header: "Pinned", render: (r) => (r.pinned ? "Yes" : "—") },
          ]}
        />
      </div>
    </>
  );
}
