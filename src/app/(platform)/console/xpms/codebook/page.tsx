import { ModuleHeader } from "@/components/Shell";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui";
import { hasSupabase } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { formatXtcCode } from "@/lib/xpms";

export const dynamic = "force-dynamic";

type CodebookRow = {
  // DataTable requires `id`; we synthesise from the line code
  id: string;
  class_code: number;
  class_name: string | null;
  division_code: number;
  division_name: string | null;
  section_code: number;
  section_name: string | null;
  line_code: number;
  line_name: string | null;
  face: "org" | "finance" | "both";
  is_position_root: boolean;
};

const FACE_VARIANT: Record<CodebookRow["face"], "info" | "warning" | "success"> = {
  org: "info",
  finance: "success",
  both: "warning",
};

export default async function CodebookPage() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="XPMS" title="XTC Codebook" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("v_xtc_codebook")
    .select(
      "class_code, class_name, division_code, division_name, section_code, section_name, line_code, line_name, face, is_position_root",
    )
    .order("line_code");
  const rawRows = (data ?? []) as Omit<CodebookRow, "id">[];
  const rows: CodebookRow[] = rawRows.map((r) => ({ ...r, id: String(r.line_code) }));

  return (
    <>
      <ModuleHeader
        eyebrow="XPMS · XTC Protocol™"
        title="Codebook"
        subtitle="Class → Division → Section → Line. Append-only governance — codes are stable forever."
      />
      <div className="page-content">
        {error ? <div className="surface p-4 text-sm">Could not load codebook: {error.message}</div> : null}
        <DataTable<CodebookRow>
          tableId="xpms.codebook"
          rows={rows}
          searchable
          emptyLabel="No published line items yet"
          emptyDescription="Divisions and sections are reserved; line items publish on demand."
          columns={[
            {
              key: "code",
              header: "Code",
              render: (r) => formatXtcCode(r.line_code),
              accessor: (r) => r.line_code,
              className: "font-mono text-xs",
              sortable: true,
            },
            {
              key: "class",
              header: "Class",
              render: (r) => r.class_name ?? "—",
              accessor: (r) => r.class_name ?? null,
              className: "text-xs",
              sortable: true,
              filterable: true,
              groupable: true,
            },
            {
              key: "division",
              header: "Division",
              render: (r) => r.division_name ?? "—",
              accessor: (r) => r.division_name ?? null,
              className: "text-xs",
              sortable: true,
              filterable: true,
              groupable: true,
            },
            {
              key: "section",
              header: "Section",
              render: (r) => r.section_name ?? "—",
              accessor: (r) => r.section_name ?? null,
              className: "text-xs",
              sortable: true,
              filterable: true,
              groupable: true,
            },
            {
              key: "line",
              header: "Line item",
              render: (r) => (
                <span className="text-xs">
                  {r.line_name}
                  {r.is_position_root ? <span className="ml-2 text-[10px] text-[var(--text-muted)]">root</span> : null}
                </span>
              ),
              accessor: (r) => r.line_name ?? null,
              sortable: true,
            },
            {
              key: "face",
              header: "Face",
              render: (r) => <Badge variant={FACE_VARIANT[r.face]}>{r.face}</Badge>,
              accessor: (r) => r.face,
              sortable: true,
              filterable: true,
              groupable: true,
            },
          ]}
        />
      </div>
    </>
  );
}
