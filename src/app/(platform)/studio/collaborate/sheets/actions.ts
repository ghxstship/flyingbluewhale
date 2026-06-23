"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { actionFail, formFail } from "@/lib/forms/fail";
import { SHEET_STATES, sheetSavePayloadSchema } from "@/lib/sheets";

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

// ============================================================
// Create
// ============================================================
const CreateSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  description: z.string().max(4000).optional().or(z.literal("")),
});

export async function createSheetAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Only manager+ can create sheets" };
  const parsed = CreateSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const d = parsed.data;
  const db = (await createClient()) as unknown as LooseSupabase;
  // Seed a sensible starter schema so the grid isn't blank on first open.
  const starterColumns = [
    { key: "name", label: "Name", type: "text" },
    { key: "notes", label: "Notes", type: "text" },
  ];
  const { data, error } = await db
    .from("sheets")
    .insert({
      org_id: session.orgId,
      name: d.name,
      description: d.description || null,
      columns: starterColumns,
      sheet_state: "active",
      created_by: session.userId,
    })
    .select("id")
    .single();
  if (error || !data) return actionFail(error?.message ?? "Could not create sheet", fd);
  revalidatePath("/studio/collaborate/sheets");
  redirect(`/studio/collaborate/sheets/${data.id}`);
}

// ============================================================
// Bulk save (columns + rows) — the editable grid's persistence path.
// Replaces the full row set for the sheet (delete-then-insert) inside the
// caller's RLS scope so position/cell edits, additions, and removals all
// land atomically from the user's perspective.
// ============================================================
export async function saveSheetAction(sheetId: string, payloadJson: string): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Only manager+ can edit sheets" };

  let raw: unknown;
  try {
    raw = JSON.parse(payloadJson);
  } catch {
    return { error: "Malformed payload" };
  }
  const parsed = sheetSavePayloadSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Validation failed" };
  }
  const { columns, rows } = parsed.data;

  // Drop cell keys that no longer correspond to a defined column.
  const colKeys = new Set(columns.map((c) => c.key));
  const cleanRows = rows.map((r, i) => {
    const cells: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(r.cells)) {
      if (colKeys.has(k)) cells[k] = v;
    }
    return { position: i, cells };
  });

  const db = (await createClient()) as unknown as LooseSupabase;

  // 1. Persist the column schema on the parent sheet.
  const { error: colErr } = await db
    .from("sheets")
    .update({ columns })
    .eq("id", sheetId)
    .eq("org_id", session.orgId)
    .is("deleted_at", null);
  if (colErr) return { error: colErr.message };

  // 2. Replace the row set. Soft-delete is overkill for a transient grid —
  // hard-delete the existing rows for this sheet then insert the new set.
  const { error: delErr } = await db
    .from("sheet_rows")
    .delete()
    .eq("sheet_id", sheetId)
    .eq("org_id", session.orgId);
  if (delErr) return { error: delErr.message };

  if (cleanRows.length > 0) {
    const { error: insErr } = await db.from("sheet_rows").insert(
      cleanRows.map((r) => ({
        org_id: session.orgId,
        sheet_id: sheetId,
        position: r.position,
        cells: r.cells,
        created_by: session.userId,
      })),
    );
    if (insErr) return { error: insErr.message };
  }

  revalidatePath(`/studio/collaborate/sheets/${sheetId}`);
  return { ok: true };
}

// ============================================================
// Lifecycle toggle
// ============================================================
const StateSchema = z.object({ sheet_state: z.enum(SHEET_STATES) });

export async function setSheetStateAction(sheetId: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Only manager+ can change sheet state" };
  const parsed = StateSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Invalid state" };
  const db = (await createClient()) as unknown as LooseSupabase;
  const { error } = await db
    .from("sheets")
    .update({ sheet_state: parsed.data.sheet_state })
    .eq("id", sheetId)
    .eq("org_id", session.orgId)
    .is("deleted_at", null);
  if (error) return { error: error.message };
  revalidatePath(`/studio/collaborate/sheets/${sheetId}`);
  revalidatePath("/studio/collaborate/sheets");
  return { ok: true };
}

// ============================================================
// Soft delete
// ============================================================
export async function deleteSheetAction(sheetId: string): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Only manager+ can delete sheets" };
  const db = (await createClient()) as unknown as LooseSupabase;
  const { error } = await db
    .from("sheets")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", sheetId)
    .eq("org_id", session.orgId);
  if (error) return { error: error.message };
  revalidatePath("/studio/collaborate/sheets");
  redirect("/studio/collaborate/sheets");
}
