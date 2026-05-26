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

const STATE_TONE: Record<SectionState, "muted" | "info" | "warning" | "success" | "error"> = {
  draft: "muted",
  in_review: "warning",
  issued: "success",
  superseded: "info",
  archived: "muted",
};

const FORMAT_LABEL: Record<SpecFormat, string> = {
  masterformat_2026: "MasterFormat 2026",
  masterformat_1995: "MasterFormat 1995",
  uniformat_2_2: "Uniformat II",
  nrm2: "NRM2",
  custom: "Custom",
};

export default async function Page() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Creative" title="Specifications" />
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
        eyebrow="Creative"
        title="Specifications"
        subtitle={`${rows.length} Section${rows.length === 1 ? "" : "s"} · ${issuedCount} Issued · ${inReviewCount} In Review · ${draftCount} Draft`}
        action={
          <Button href="/console/specs/new" size="sm">
            + New Section
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-4">
          <MetricCard label="Total Sections" value={fmt.number(rows.length)} accent />
          <MetricCard label="Issued" value={fmt.number(issuedCount)} />
          <MetricCard label="In Review" value={fmt.number(inReviewCount)} />
          <MetricCard label="Draft" value={fmt.number(draftCount)} />
        </div>
        <DataTable<Row>
          rows={rows}
          rowHref={(r) => `/console/specs/${r.id}`}
          emptyLabel="No spec sections yet"
          emptyDescription="Specifications anchor RFIs and submittals to a section number (CSI MasterFormat, Uniformat, etc.). Start by adding the first division."
          emptyAction={
            <Button href="/console/specs/new" size="sm">
              + New Section
            </Button>
          }
          columns={[
            {
              key: "section_number",
              header: "Number",
              render: (r) => r.section_number,
              accessor: (r) => r.section_number,
              className: "font-mono text-xs",
            },
            { key: "title", header: "Title", render: (r) => r.title, accessor: (r) => r.title },
            {
              key: "division",
              header: "Division",
              render: (r) => r.division ?? "—",
              accessor: (r) => r.division,
              filterable: true,
              groupable: true,
              className: "text-xs",
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
              key: "format",
              header: "Format",
              render: (r) => FORMAT_LABEL[r.format],
              accessor: (r) => r.format,
              filterable: true,
              groupable: true,
              className: "text-xs",
            },
            {
              key: "state",
              header: "State",
              render: (r) => <Badge variant={STATE_TONE[r.section_state]}>{toTitle(r.section_state)}</Badge>,
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
