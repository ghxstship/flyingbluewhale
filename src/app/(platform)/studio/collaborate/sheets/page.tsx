import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataView } from "@/components/views/DataViewServer";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import type { Sheet } from "@/lib/sheets";

export const dynamic = "force-dynamic";

type SheetListRow = Pick<Sheet, "id" | "name" | "description" | "sheet_state" | "columns" | "updated_at">;

export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.collaborate.sheets.eyebrow", undefined, "Collaborate")}
          title={t("console.collaborate.sheets.title", undefined, "Sheets")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.collaborate.sheets.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const db = (await createClient()) as unknown as LooseSupabase;
  const { data } = await db
    .from("sheets")
    .select("id, name, description, sheet_state, columns, updated_at")
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(500);
  const rows = ((data ?? []) as SheetListRow[]).map((r) => ({
    ...r,
    columns: Array.isArray(r.columns) ? r.columns : [],
  }));

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.collaborate.sheets.eyebrow", undefined, "Collaborate")}
        title={t("console.collaborate.sheets.title", undefined, "Sheets")}
        subtitle={
          rows.length === 1
            ? t("console.collaborate.sheets.subtitleOne", undefined, "1 sheet")
            : t("console.collaborate.sheets.subtitleMany", { count: rows.length }, `${rows.length} sheets`)
        }
        action={
          <Button href="/studio/collaborate/sheets/new" size="sm">
            {t("console.collaborate.sheets.newSheet", undefined, "+ New Sheet")}
          </Button>
        }
      />
      <div className="page-content">
        <DataView<SheetListRow>
          rows={rows}
          rowHref={(r) => `/studio/collaborate/sheets/${r.id}`}
          emptyLabel={t("console.collaborate.sheets.empty", undefined, "No sheets yet")}
          emptyDescription={t(
            "console.collaborate.sheets.emptyDescription",
            undefined,
            "Build an Airtable-style grid: define columns, add rows, edit cells inline, and save in bulk.",
          )}
          emptyAction={
            <Button href="/studio/collaborate/sheets/new" size="sm">
              {t("console.collaborate.sheets.newSheet", undefined, "+ New Sheet")}
            </Button>
          }
          columns={[
            {
              key: "name",
              header: t("console.collaborate.sheets.columns.name", undefined, "Name"),
              render: (r) => r.name,
              accessor: (r) => r.name,
            },
            {
              key: "columns",
              header: t("console.collaborate.sheets.columns.columns", undefined, "Columns"),
              render: (r) => r.columns.length,
              accessor: (r) => r.columns.length,
              mono: true,
            },
            {
              key: "sheet_state",
              header: t("console.collaborate.sheets.columns.status", undefined, "Status"),
              render: (r) => <StatusBadge status={r.sheet_state} />,
              accessor: (r) => r.sheet_state,
              filterable: true,
              groupable: true,
            },
            {
              key: "updated_at",
              header: t("console.collaborate.sheets.columns.updated", undefined, "Updated"),
              render: (r) => r.updated_at?.slice(0, 10),
              accessor: (r) => r.updated_at ?? null,
              mono: true,
            },
          ]}
        />
      </div>
    </>
  );
}
