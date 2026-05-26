import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { getRequestFormatters } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";

export const dynamic = "force-dynamic";

type SheetSetState = "draft" | "in_review" | "published" | "superseded" | "archived";

type Row = {
  id: string;
  name: string;
  discipline: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
  project: { name: string | null } | null;
  current_version: { id: string; version_label: string; set_state: SheetSetState; published_at: string | null } | null;
  member_count: number;
};

const STATE_TONE: Record<SheetSetState, "muted" | "info" | "warning" | "success" | "error"> = {
  draft: "muted",
  in_review: "warning",
  published: "success",
  superseded: "info",
  archived: "muted",
};

export default async function Page() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Creative" title="Drawings" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = (await createClient()) as unknown as LooseSupabase;
  const fmt = await getRequestFormatters();

  const { data } = await supabase
    .from("sheet_sets")
    .select(
      "id, name, discipline, description, created_at, updated_at, project:project_id(name), current_version:current_version_id(id, version_label, set_state, published_at)",
    )
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(200);

  const baseRows = (data ?? []) as unknown as Omit<Row, "member_count">[];

  // Hydrate member counts for each set's current version (one round-trip).
  const versionIds = baseRows.map((r) => r.current_version?.id).filter((id): id is string => !!id);
  const memberCounts: Record<string, number> = {};
  if (versionIds.length > 0) {
    const { data: members } = await supabase
      .from("sheet_set_members")
      .select("sheet_set_version_id")
      .in("sheet_set_version_id", versionIds);
    for (const m of (members ?? []) as { sheet_set_version_id: string }[]) {
      memberCounts[m.sheet_set_version_id] = (memberCounts[m.sheet_set_version_id] ?? 0) + 1;
    }
  }
  const rows: Row[] = baseRows.map((r) => ({
    ...r,
    member_count: r.current_version ? (memberCounts[r.current_version.id] ?? 0) : 0,
  }));

  const publishedCount = rows.filter((r) => r.current_version?.set_state === "published").length;
  const inReviewCount = rows.filter((r) => r.current_version?.set_state === "in_review").length;
  const draftCount = rows.filter((r) => !r.current_version || r.current_version.set_state === "draft").length;

  return (
    <>
      <ModuleHeader
        eyebrow="Creative"
        title="Drawings"
        subtitle={`${rows.length} Sheet Set${rows.length === 1 ? "" : "s"} · ${publishedCount} Published · ${inReviewCount} In Review · ${draftCount} Draft`}
        action={
          <Button href="/console/drawings/new" size="sm">
            + New Sheet Set
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-4">
          <MetricCard label="Total Sets" value={fmt.number(rows.length)} accent />
          <MetricCard label="Published" value={fmt.number(publishedCount)} />
          <MetricCard label="In Review" value={fmt.number(inReviewCount)} />
          <MetricCard label="Draft" value={fmt.number(draftCount)} />
        </div>
        <DataTable<Row>
          rows={rows}
          rowHref={(r) => `/console/drawings/${r.id}`}
          emptyLabel="No sheet sets yet"
          emptyDescription="Group individual sheets into a versioned package — e.g. 50% DD, 100% CD — and publish for slip-sheet diff."
          emptyAction={
            <Button href="/console/drawings/new" size="sm">
              + New Sheet Set
            </Button>
          }
          columns={[
            {
              key: "name",
              header: "Name",
              render: (r) => r.name,
              accessor: (r) => r.name,
            },
            {
              key: "project",
              header: "Project",
              render: (r) => r.project?.name ?? "—",
              accessor: (r) => r.project?.name ?? null,
              filterable: true,
              groupable: true,
            },
            {
              key: "discipline",
              header: "Discipline",
              render: (r) => r.discipline ?? "—",
              accessor: (r) => r.discipline,
              filterable: true,
              groupable: true,
              className: "font-mono text-xs",
            },
            {
              key: "version",
              header: "Current Version",
              render: (r) =>
                r.current_version?.version_label ?? <span className="text-[var(--text-muted)]">— none —</span>,
              accessor: (r) => r.current_version?.version_label ?? null,
              className: "font-mono text-xs",
            },
            {
              key: "sheets",
              header: "Sheets",
              render: (r) => fmt.number(r.member_count),
              accessor: (r) => r.member_count,
              className: "font-mono text-xs text-right",
            },
            {
              key: "state",
              header: "State",
              render: (r) =>
                r.current_version ? (
                  <Badge variant={STATE_TONE[r.current_version.set_state]}>
                    {toTitle(r.current_version.set_state)}
                  </Badge>
                ) : (
                  <Badge variant="muted">Draft</Badge>
                ),
              accessor: (r) => r.current_version?.set_state ?? "draft",
              filterable: true,
              groupable: true,
            },
          ]}
        />
      </div>
    </>
  );
}
