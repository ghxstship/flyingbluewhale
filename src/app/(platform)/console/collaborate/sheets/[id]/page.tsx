import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { hasSupabase } from "@/lib/env";
import type { Sheet, SheetColumn, SheetRow } from "@/lib/sheets";
import { SheetGrid } from "./SheetGrid";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Sheets" title="Sheet" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const db = (await createClient()) as unknown as LooseSupabase;

  const { data: sheet } = await db
    .from("sheets")
    .select("id, org_id, name, description, columns, sheet_state, created_at, updated_at")
    .eq("id", id)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .single();
  if (!sheet) notFound();
  const s = sheet as Sheet;
  const columns: SheetColumn[] = Array.isArray(s.columns) ? s.columns : [];

  const { data: rowData } = await db
    .from("sheet_rows")
    .select("id, sheet_id, position, cells")
    .eq("sheet_id", id)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .order("position", { ascending: true })
    .limit(5000);
  const rows = ((rowData ?? []) as SheetRow[]).map((r) => ({
    ...r,
    cells: r.cells && typeof r.cells === "object" ? r.cells : {},
  }));

  const canEdit = isManagerPlus(session);

  return (
    <>
      <ModuleHeader
        eyebrow="Sheets"
        title={s.name}
        subtitle={s.description ?? undefined}
        action={<StatusBadge status={s.sheet_state} />}
      />
      <div className="page-content">
        <SheetGrid
          sheetId={s.id}
          sheetState={s.sheet_state}
          initialColumns={columns}
          initialRows={rows}
          canEdit={canEdit}
        />
      </div>
    </>
  );
}
