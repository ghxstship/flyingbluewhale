import { ModuleHeader } from "@/components/Shell";
import { DataView } from "@/components/views/DataViewServer";
import { Badge } from "@/components/ui";
import { hasSupabase } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { formatXtcCode } from "@/lib/xpms";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

type CodebookRow = {
  // DataView requires `id`; we synthesise from the line code
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
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="XPMS" title={t("console.xpms.codebook.titleShort", undefined, "XTC Codebook")} />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.xpms.codebook.configureSupabase", undefined, "Configure Supabase.")}
          </div>
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
        title={t("console.xpms.codebook.title", undefined, "Codebook")}
        subtitle={t("console.xpms.codebook.subtitle", undefined, "Class → Division → Section → Line.")}
      />
      <div className="page-content">
        {error ? (
          <div className="surface p-4 text-sm">
            {t(
              "console.xpms.codebook.loadError",
              { message: error.message },
              `Could not load codebook: ${error.message}`,
            )}
          </div>
        ) : null}
        <DataView<CodebookRow>
          tableId="xpms.codebook"
          rows={rows}
          searchable
          emptyLabel={t("console.xpms.codebook.empty.label", undefined, "No published line items yet")}
          emptyDescription={t(
            "console.xpms.codebook.empty.description",
            undefined,
            "Divisions and sections are reserved; line items publish on demand.",
          )}
          columns={[
            {
              key: "code",
              header: t("console.xpms.codebook.columns.code", undefined, "Code"),
              render: (r) => formatXtcCode(r.line_code),
              accessor: (r) => r.line_code,
              mono: true,
              sortable: true,
            },
            {
              key: "class",
              header: t("console.xpms.codebook.columns.class", undefined, "Class"),
              render: (r) => r.class_name ?? "—",
              accessor: (r) => r.class_name ?? null,
              className: "text-xs",
              sortable: true,
              filterable: true,
              groupable: true,
            },
            {
              key: "division",
              header: t("console.xpms.codebook.columns.division", undefined, "Division"),
              render: (r) => r.division_name ?? "—",
              accessor: (r) => r.division_name ?? null,
              className: "text-xs",
              sortable: true,
              filterable: true,
              groupable: true,
            },
            {
              key: "section",
              header: t("console.xpms.codebook.columns.section", undefined, "Section"),
              render: (r) => r.section_name ?? "—",
              accessor: (r) => r.section_name ?? null,
              className: "text-xs",
              sortable: true,
              filterable: true,
              groupable: true,
            },
            {
              key: "line",
              header: t("console.xpms.codebook.columns.line", undefined, "Line item"),
              render: (r) => (
                <span className="text-xs">
                  {r.line_name}
                  {r.is_position_root ? (
                    <span className="ms-2 text-[11px] text-[var(--p-text-2)]">
                      {t("console.xpms.codebook.rootLabel", undefined, "root")}
                    </span>
                  ) : null}
                </span>
              ),
              accessor: (r) => r.line_name ?? null,
              sortable: true,
            },
            {
              key: "face",
              header: t("console.xpms.codebook.columns.face", undefined, "Face"),
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
