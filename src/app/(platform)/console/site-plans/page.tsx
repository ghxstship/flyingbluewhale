import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  code: string;
  title: string;
  discipline: string;
  created_at: string;
  project: { name: string | null } | null;
  venue: { name: string | null } | null;
  current_revision: { revision_label: string | null } | null;
};

const DISCIPLINE_TONE: Record<string, "muted" | "info" | "warning" | "error" | "success"> = {
  rigging: "warning",
  power: "warning",
  evacuation: "error",
  accessibility: "info",
  audio: "info",
  video: "info",
  lighting: "info",
};

export default async function Page() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Venues" title="Site Plans" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const { data } = await supabase
    .from("site_plans")
    .select(
      "id, code, title, discipline, created_at, project:project_id(name), venue:venue_id(name), current_revision:current_revision_id(revision_label)",
    )
    .eq("org_id", session.orgId)
    .order("created_at", { ascending: false })
    .limit(200);

  const rows = (data ?? []) as unknown as Row[];

  return (
    <>
      <ModuleHeader
        eyebrow="Venues"
        title="Site Plans"
        subtitle={`${rows.length} sheet${rows.length === 1 ? "" : "s"} across all projects · floorplans, rigging, power, evacuation, hospitality zones`}
        action={
          <Button href="/console/site-plans/new" size="sm">
            + New plan
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard label="Total plans" value={rows.length.toLocaleString()} accent />
          <MetricCard label="Disciplines" value={String(new Set(rows.map((r) => r.discipline)).size)} />
          <MetricCard
            label="Venues covered"
            value={String(new Set(rows.map((r) => r.venue?.name).filter(Boolean)).size)}
          />
        </div>
        <DataTable<Row>
          rows={rows}
          rowHref={(r) => `/console/site-plans/${r.id}`}
          emptyLabel="No site plans yet"
          emptyDescription="Upload venue floorplans or production drawings. Versioned via revisions, pinnable to issues, RFIs, and punch items."
          emptyAction={
            <Button href="/console/site-plans/new" size="sm">
              + New plan
            </Button>
          }
          columns={[
            { key: "code", header: "Sheet", render: (r) => r.code, className: "font-mono text-xs" },
            { key: "title", header: "Title", render: (r) => r.title },
            { key: "venue", header: "Venue", render: (r) => r.venue?.name ?? r.project?.name ?? "—" },
            {
              key: "discipline",
              header: "Discipline",
              render: (r) => <Badge variant={DISCIPLINE_TONE[r.discipline] ?? "muted"}>{r.discipline}</Badge>,
            },
            {
              key: "rev",
              header: "Current rev",
              render: (r) => r.current_revision?.revision_label ?? "—",
              className: "font-mono text-xs",
            },
          ]}
        />
      </div>
    </>
  );
}
