import { ModuleHeader } from "@/components/Shell";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { toTitle } from "@/lib/format";
import { formatDateTime } from "@/lib/i18n/format";

export const dynamic = "force-dynamic";

type Row = { id: string; kind: string; occurs_at: string; label: string | null; visibility: string };

export default async function Page() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Marketing" title="On-sales" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("event_milestones")
    .select("id, kind, occurs_at, label, visibility")
    .eq("org_id", session.orgId)
    .in("kind", ["onsale", "presale_start", "presale_end"])
    .gte("occurs_at", new Date(Date.now() - 7 * 86_400_000).toISOString())
    .order("occurs_at", { ascending: true })
    .limit(500);
  const rows = (data ?? []) as Row[];

  return (
    <>
      <ModuleHeader
        eyebrow="Marketing"
        title="On-sales"
        subtitle={`${rows.length} Upcoming on-sale + presale milestone${rows.length === 1 ? "" : "s"}`}
      />
      <div className="page-content space-y-5">
        <DataTable<Row>
          rows={rows}
          emptyLabel="No upcoming on-sales"
          emptyDescription="Add an event_milestone with kind onsale / presale_start / presale_end."
          columns={[
            {
              key: "kind",
              header: "Kind",
              render: (r) => <Badge variant="muted">{toTitle(r.kind)}</Badge>,
              accessor: (r) => r.kind,
              filterable: true,
              groupable: true,
            },
            { key: "label", header: "Label", render: (r) => r.label ?? "—", accessor: (r) => r.label ?? null },
            {
              key: "when",
              header: "Occurs",
              render: (r) => formatDateTime(r.occurs_at),
              accessor: (r) => r.occurs_at,
              className: "font-mono text-xs",
            },
            {
              key: "vis",
              header: "Visibility",
              render: (r) => (
                <Badge variant={r.visibility === "public" ? "success" : r.visibility === "partners" ? "info" : "muted"}>
                  {r.visibility}
                </Badge>
              ),
              accessor: (r) => r.visibility,
              filterable: true,
            },
          ]}
        />
      </div>
    </>
  );
}
