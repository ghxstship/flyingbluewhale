import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { STATE_LABEL, STATE_TONE } from "@/lib/siteplan/state";
import type { SitePlanDocumentState, SitePlanSheetType } from "@/lib/siteplan/types";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  atom_id: string | null;
  code: string;
  title: string;
  sheet_type: SitePlanSheetType;
  document_state: SitePlanDocumentState;
  primary_class: number | null;
  revision_letter: string | null;
  discipline: string;
  created_at: string;
  issued_at: string | null;
  project: { name: string | null } | null;
  venue: { name: string | null } | null;
};

const SHEET_TYPE_TONE: Record<SitePlanSheetType, "muted" | "info" | "warning" | "error" | "success"> = {
  site_plan: "muted",
  floor_plan: "info",
  rcp: "info",
  power: "warning",
  egress: "error",
  flow: "info",
  signage: "info",
  section: "muted",
  as_built: "success",
};

const XPMS_CLASS_LABEL: Record<number, string> = {
  0: "0 EXECUTIVE",
  1: "1 CREATIVE",
  2: "2 TALENT",
  3: "3 MARKETING",
  4: "4 BUILD",
  5: "5 PRODUCTION",
  6: "6 OPERATIONS",
  7: "7 EXPERIENCE",
  8: "8 HOSPITALITY",
  9: "9 TECHNOLOGY",
};

export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.sitePlans.eyebrow", undefined, "Creative")}
          title={t("console.sitePlans.title", undefined, "Site Plans")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.sitePlans.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = (await createClient()) as unknown as LooseSupabase;
  const fmt = await getRequestFormatters();

  const { data } = await supabase
    .from("site_plans")
    .select(
      "id, atom_id, code, title, sheet_type, document_state, primary_class, revision_letter, discipline, created_at, issued_at, project:project_id(name), venue:venue_id(name)",
    )
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(200);

  const rows = (data ?? []) as unknown as Row[];

  const issuedCount = rows.filter((r) => r.document_state === "issued").length;
  const inReviewCount = rows.filter((r) => r.document_state === "in_review").length;
  const draftCount = rows.filter((r) => r.document_state === "draft").length;

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.sitePlans.eyebrow", undefined, "Creative")}
        title={t("console.sitePlans.title", undefined, "Site Plans")}
        subtitle={`${rows.length} ${rows.length === 1 ? t("console.sitePlans.sheet", undefined, "Sheet") : t("console.sitePlans.sheets", undefined, "Sheets")} · ${issuedCount} ${t("console.sitePlans.issued", undefined, "Issued")} · ${inReviewCount} ${t("console.sitePlans.inReview", undefined, "In Review")} · ${draftCount} ${t("console.sitePlans.draft", undefined, "Draft")}`}
        action={
          <Button href="/console/site-plans/new" size="sm">
            {t("console.sitePlans.newSheet", undefined, "+ New Sheet")}
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <MetricCard
            label={t("console.sitePlans.totalSheets", undefined, "Total Sheets")}
            value={fmt.number(rows.length)}
            accent
          />
          <MetricCard
            label={t("console.sitePlans.issuedIfc", undefined, "Issued (IFC)")}
            value={fmt.number(issuedCount)}
          />
          <MetricCard
            label={t("console.sitePlans.inReview", undefined, "In Review")}
            value={fmt.number(inReviewCount)}
          />
          <MetricCard label={t("console.sitePlans.draft", undefined, "Draft")} value={fmt.number(draftCount)} />
        </div>
        <DataTable<Row>
          rows={rows}
          rowHref={(r) => `/console/site-plans/${r.id}`}
          emptyLabel={t("console.sitePlans.emptyLabel", undefined, "No site plans yet")}
          emptyDescription={t(
            "console.sitePlans.emptyDescription",
            undefined,
            "Pick a preset to scaffold zones, bands, and stations in one step.",
          )}
          emptyAction={
            <Button href="/console/site-plans/new" size="sm">
              {t("console.sitePlans.newSheet", undefined, "+ New Sheet")}
            </Button>
          }
          columns={[
            {
              key: "atom_id",
              header: t("console.sitePlans.columns.atomId", undefined, "Atom ID"),
              render: (r) =>
                r.atom_id ?? (
                  <span className="text-[var(--text-muted)]">
                    {t("console.sitePlans.pending", undefined, "— pending —")}
                  </span>
                ),
              accessor: (r) => r.atom_id,
              className: "font-mono text-[11px]",
            },
            {
              key: "title",
              header: t("console.sitePlans.columns.title", undefined, "Title"),
              render: (r) => r.title,
              accessor: (r) => r.title,
            },
            {
              key: "sheet_type",
              header: t("console.sitePlans.columns.type", undefined, "Type"),
              render: (r) => <Badge variant={SHEET_TYPE_TONE[r.sheet_type]}>{r.sheet_type}</Badge>,
              accessor: (r) => r.sheet_type,
              filterable: true,
              groupable: true,
            },
            {
              key: "class",
              header: t("console.sitePlans.columns.class", undefined, "Class"),
              render: (r) =>
                r.primary_class != null ? (
                  <span className="font-mono text-[11px]">{XPMS_CLASS_LABEL[r.primary_class]}</span>
                ) : (
                  "—"
                ),
              accessor: (r) => (r.primary_class != null ? XPMS_CLASS_LABEL[r.primary_class] : null),
              filterable: true,
              groupable: true,
            },
            {
              key: "document_state",
              header: t("console.sitePlans.columns.state", undefined, "State"),
              render: (r) => <Badge variant={STATE_TONE[r.document_state]}>{STATE_LABEL[r.document_state]}</Badge>,
              accessor: (r) => r.document_state,
              filterable: true,
              groupable: true,
            },
            {
              key: "rev",
              header: t("console.sitePlans.columns.rev", undefined, "Rev"),
              render: (r) => r.revision_letter ?? "—",
              className: "font-mono text-xs",
              accessor: (r) => r.revision_letter,
            },
            {
              key: "venue",
              header: t("console.sitePlans.columns.venueProject", undefined, "Venue / Project"),
              render: (r) => r.venue?.name ?? r.project?.name ?? "—",
              accessor: (r) => r.venue?.name ?? r.project?.name ?? null,
            },
          ]}
        />
      </div>
    </>
  );
}
