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

type SectionState = "draft" | "in_review" | "issued" | "superseded" | "archived";
type SpecFormat = "masterformat_2026" | "masterformat_1995" | "uniformat_2_2" | "nrm2" | "custom";

type Row = {
  id: string;
  section_number: string;
  title: string;
  division: string | null;
  format: SpecFormat;
  section_state: SectionState;
  issued_at: string | null;
  created_at: string;
  project: { name: string | null } | null;
};

const FORMAT_LABEL: Record<SpecFormat, string> = {
  masterformat_2026: "MasterFormat 2026",
  masterformat_1995: "MasterFormat 1995",
  uniformat_2_2: "Uniformat II",
  nrm2: "NRM2",
  custom: "Custom",
};

export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.specs.eyebrow", undefined, "Creative")}
          title={t("console.specs.title", undefined, "Specifications")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.specs.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = (await createClient()) as unknown as LooseSupabase;
  const fmt = await getRequestFormatters();

  const { data } = await supabase
    .from("spec_sections")
    .select(
      "id, section_number, title, division, format, section_state, issued_at, created_at, project:project_id(name)",
    )
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .order("section_number", { ascending: true })
    .limit(500);

  const rows = (data ?? []) as unknown as Row[];

  const issuedCount = rows.filter((r) => r.section_state === "issued").length;
  const inReviewCount = rows.filter((r) => r.section_state === "in_review").length;
  const draftCount = rows.filter((r) => r.section_state === "draft").length;

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.specs.eyebrow", undefined, "Creative")}
        title={t("console.specs.title", undefined, "Specifications")}
        subtitle={`${rows.length} ${rows.length === 1 ? t("console.specs.section", undefined, "Section") : t("console.specs.sections", undefined, "Sections")} · ${issuedCount} ${t("console.specs.issued", undefined, "Issued")} · ${inReviewCount} ${t("console.specs.inReview", undefined, "In Review")} · ${draftCount} ${t("console.specs.draft", undefined, "Draft")}`}
        action={
          <Button href="/studio/specs/new" size="sm">
            {t("console.specs.newSection", undefined, "+ New Section")}
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-4">
          <MetricCard
            label={t("console.specs.metric.totalSections", undefined, "Total Sections")}
            value={fmt.number(rows.length)}
            accent
          />
          <MetricCard label={t("console.specs.metric.issued", undefined, "Issued")} value={fmt.number(issuedCount)} />
          <MetricCard
            label={t("console.specs.metric.inReview", undefined, "In Review")}
            value={fmt.number(inReviewCount)}
          />
          <MetricCard label={t("console.specs.metric.draft", undefined, "Draft")} value={fmt.number(draftCount)} />
        </div>
        <DataView<Row>
          rows={rows}
          rowHref={(r) => `/studio/specs/${r.id}`}
          emptyLabel={t("console.specs.empty.label", undefined, "No spec sections yet")}
          emptyDescription={t(
            "console.specs.empty.description",
            undefined,
            "Specifications anchor RFIs and submittals to a section number (CSI MasterFormat, Uniformat, etc.). Start by adding the first division.",
          )}
          emptyAction={
            <Button href="/studio/specs/new" size="sm">
              {t("console.specs.newSection", undefined, "+ New Section")}
            </Button>
          }
          columns={[
            {
              key: "section_number",
              header: t("console.specs.column.number", undefined, "Number"),
              render: (r) => r.section_number,
              accessor: (r) => r.section_number,
              mono: true,
            },
            {
              key: "title",
              header: t("console.specs.column.title", undefined, "Title"),
              render: (r) => r.title,
              accessor: (r) => r.title,
            },
            {
              key: "division",
              header: t("console.specs.column.division", undefined, "Division"),
              render: (r) => r.division ?? "—",
              accessor: (r) => r.division,
              filterable: true,
              groupable: true,
              className: "text-xs",
            },
            {
              key: "project",
              header: t("console.specs.column.project", undefined, "Project"),
              render: (r) => r.project?.name ?? "—",
              accessor: (r) => r.project?.name ?? null,
              filterable: true,
              groupable: true,
            },
            {
              key: "format",
              header: t("console.specs.column.format", undefined, "Format"),
              render: (r) => FORMAT_LABEL[r.format],
              accessor: (r) => r.format,
              filterable: true,
              groupable: true,
              className: "text-xs",
            },
            {
              key: "state",
              header: t("console.specs.column.state", undefined, "State"),
              render: (r) => <Badge variant={toneFor(r.section_state)}>{toTitle(r.section_state)}</Badge>,
              accessor: (r) => r.section_state,
              filterable: true,
              groupable: true,
            },
          ]}
        />
      </div>
    </>
  );
}
