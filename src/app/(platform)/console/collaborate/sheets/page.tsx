import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { hasSupabase } from "@/lib/env";
import type { Sheet } from "@/lib/sheets";

export const dynamic = "force-dynamic";

type SheetListRow = Pick<Sheet, "id" | "name" | "description" | "sheet_state" | "columns" | "updated_at">;

export default async function Page() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Collaborate" title="Sheets" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
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
        eyebrow="Collaborate"
        title="Sheets"
        subtitle={rows.length === 1 ? "1 sheet" : `${rows.length} sheets`}
        action={
          <Button href="/console/collaborate/sheets/new" size="sm">
            + New Sheet
          </Button>
        }
      />
      <div className="page-content">
        <DataTable<SheetListRow>
          rows={rows}
          rowHref={(r) => `/console/collaborate/sheets/${r.id}`}
          emptyLabel="No sheets yet"
          emptyDescription="Build an Airtable-style grid — define columns, add rows, edit cells inline, and save in bulk."
          emptyAction={
            <Button href="/console/collaborate/sheets/new" size="sm">
              + New Sheet
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
              key: "columns",
              header: "Columns",
              render: (r) => <span className="font-mono text-xs">{r.columns.length}</span>,
              accessor: (r) => r.columns.length,
            },
            {
              key: "sheet_state",
              header: "State",
              render: (r) => <StatusBadge status={r.sheet_state} />,
              accessor: (r) => r.sheet_state,
              filterable: true,
              groupable: true,
            },
            {
              key: "updated_at",
              header: "Updated",
              render: (r) => <span className="font-mono text-xs">{r.updated_at?.slice(0, 10)}</span>,
              accessor: (r) => r.updated_at ?? null,
            },
          ]}
        />
      </div>
    </>
  );
}
