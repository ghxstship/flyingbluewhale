import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  icon: string | null;
  created_at: string;
};

export default async function Page() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Workforce" title="Badges" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("badges")
    .select("id, code, name, description, icon, created_at")
    .eq("org_id", session.orgId)
    .order("name");
  const rows = (data ?? []) as Row[];

  // Award counts in a single round trip.
  const { data: awards } = await supabase.from("badge_awards").select("badge_id").eq("org_id", session.orgId);
  const awardCount = new Map<string, number>();
  for (const a of (awards ?? []) as Array<{ badge_id: string }>) {
    awardCount.set(a.badge_id, (awardCount.get(a.badge_id) ?? 0) + 1);
  }

  return (
    <>
      <ModuleHeader
        eyebrow="Workforce"
        title="Badges"
        subtitle={`${rows.length} badge${rows.length === 1 ? "" : "s"} · award to crew via recognition`}
        action={
          <Button href="/console/workforce/badges/new" size="sm">
            + New Badge
          </Button>
        }
      />
      <div className="page-content">
        <DataTable<Row>
          rows={rows}
          rowHref={(r) => `/console/workforce/badges/${r.id}`}
          emptyLabel="No badges yet"
          emptyDescription="Define org-specific recognition badges (e.g. 'Safety Star', 'Customer Hero'). Award them from each badge's page."
          columns={[
            {
              key: "icon",
              header: "Icon",
              render: (r) => <span className="font-mono text-base">{r.icon ?? "🏅"}</span>,
            },
            { key: "name", header: "Name", render: (r) => r.name },
            { key: "code", header: "Code", render: (r) => r.code, mono: true },
            {
              key: "awards",
              header: "Awarded",
              render: (r) => <span className="font-mono">{awardCount.get(r.id) ?? 0}</span>,
              mono: true,
            },
          ]}
        />
      </div>
    </>
  );
}
