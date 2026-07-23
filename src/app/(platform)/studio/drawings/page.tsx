import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataView } from "@/components/views/DataViewServer";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";
import { toneFor } from "@/lib/tones";

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

export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.drawings.eyebrow", undefined, "Creative")}
          title={t("console.drawings.title", undefined, "Drawings")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.drawings.configureSupabase", undefined, "Configure Supabase.")}
          </div>
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
        eyebrow={t("console.drawings.eyebrow", undefined, "Creative")}
        title={t("console.drawings.title", undefined, "Drawings")}
        subtitle={`${rows.length} ${rows.length === 1 ? t("console.drawings.sheetSet", undefined, "Sheet Set") : t("console.drawings.sheetSets", undefined, "Sheet Sets")} · ${publishedCount} ${t("console.drawings.published", undefined, "Published")} · ${inReviewCount} ${t("console.drawings.inReview", undefined, "In Review")} · ${draftCount} ${t("console.drawings.draft", undefined, "Draft")}`}
        action={
          <Button href="/studio/drawings/new" size="sm">
            {t("console.drawings.newSheetSet", undefined, "+ New Sheet Set")}
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-4">
          <MetricCard
            label={t("console.drawings.totalSets", undefined, "Total Sets")}
            value={fmt.number(rows.length)}
            accent
          />
          <MetricCard
            label={t("console.drawings.published", undefined, "Published")}
            value={fmt.number(publishedCount)}
          />
          <MetricCard
            label={t("console.drawings.inReview", undefined, "In Review")}
            value={fmt.number(inReviewCount)}
          />
          <MetricCard label={t("console.drawings.draft", undefined, "Draft")} value={fmt.number(draftCount)} />
        </div>
        <DataView<Row>
          rows={rows}
          rowHref={(r) => `/studio/drawings/${r.id}`}
          emptyLabel={t("console.drawings.emptyLabel", undefined, "No sheet sets yet")}
          emptyDescription={t(
            "console.drawings.emptyDescription",
            undefined,
            "Group individual sheets into a versioned package (e.g. 50% DD, 100% CD) and publish for slip-sheet diff.",
          )}
          emptyAction={
            <Button href="/studio/drawings/new" size="sm">
              {t("console.drawings.newSheetSet", undefined, "+ New Sheet Set")}
            </Button>
          }
          columns={[
            {
              key: "name",
              header: t("console.drawings.col.name", undefined, "Name"),
              render: (r) => r.name,
              accessor: (r) => r.name,
            },
            {
              key: "project",
              header: t("console.drawings.col.project", undefined, "Project"),
              render: (r) => r.project?.name ?? "—",
              accessor: (r) => r.project?.name ?? null,
              filterable: true,
              groupable: true,
            },
            {
              key: "discipline",
              header: t("console.drawings.col.discipline", undefined, "Discipline"),
              render: (r) => r.discipline ?? "—",
              accessor: (r) => r.discipline,
              filterable: true,
              groupable: true,
              mono: true,
            },
            {
              key: "version",
              header: t("console.drawings.col.currentVersion", undefined, "Current Version"),
              render: (r) =>
                r.current_version?.version_label ?? (
                  <span className="text-[var(--p-text-2)]">{t("console.drawings.none", undefined, "none")}</span>
                ),
              accessor: (r) => r.current_version?.version_label ?? null,
              mono: true,
            },
            {
              key: "sheets",
              header: t("console.drawings.col.sheets", undefined, "Sheets"),
              render: (r) => fmt.number(r.member_count),
              accessor: (r) => r.member_count,
              numeric: true,
            },
            {
              key: "state",
              header: t("console.drawings.col.state", undefined, "Status"),
              render: (r) =>
                r.current_version ? (
                  <Badge variant={toneFor(r.current_version.set_state)}>{toTitle(r.current_version.set_state)}</Badge>
                ) : (
                  <Badge variant="muted">{t("console.drawings.draft", undefined, "Draft")}</Badge>
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
