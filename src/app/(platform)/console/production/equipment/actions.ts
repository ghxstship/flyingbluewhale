"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { dollarsToCents } from "@/lib/format";
import type { EquipmentStatus } from "@/lib/supabase/types";
import { actionFail, formFail } from "@/lib/forms/fail";

const Schema = z.object({
  name: z.string().min(1),
  category: z.string().optional(),
  asset_tag: z.string().optional(),
  serial: z.string().optional(),
  daily_rate: z.string().optional(),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function createEquipmentAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const supabase = await createClient();
  const { error } = await supabase.from("equipment").insert({
    org_id: session.orgId,
    name: parsed.data.name,
    category: parsed.data.category || null,
    asset_tag: parsed.data.asset_tag || null,
    serial: parsed.data.serial || null,
    daily_rate_cents: parsed.data.daily_rate ? dollarsToCents(parsed.data.daily_rate) : null,
  });
  if (error) return actionFail(error.message, fd);
  revalidatePath("/console/production/equipment");
  redirect("/console/production/equipment");
}

const StatusEnum = z.enum(["available", "reserved", "in_use", "maintenance", "retired"]);

// Equipment FSM: available ↔ reserved ↔ in_use ↔ maintenance →
// retired (terminal). Retired is final — for re-use, create a new
// asset. Direct skips (e.g. available → retired without maintenance)
// are blocked because they hide depreciation/audit trail history.
const EQUIPMENT_TRANSITIONS: Record<z.infer<typeof StatusEnum>, readonly z.infer<typeof StatusEnum>[]> = {
  available: ["reserved", "in_use", "maintenance", "retired"],
  reserved: ["available", "in_use"],
  in_use: ["available", "reserved", "maintenance"],
  maintenance: ["available", "retired"],
  retired: [], // terminal
};

/**
 * Drive the equipment lifecycle. Owner/admin/controller only. Errors
 * throw so Next's error boundary surfaces them rather than silently
 * no-op'ing as before.
 */
export async function setEquipmentStatus(formData: FormData): Promise<void> {
  const session = await requireSession();
  const id = String(formData.get("id") ?? "");
  const next = StatusEnum.safeParse(formData.get("equipment_state"));
  if (!id) throw new Error("Missing equipment id");
  if (!next.success) throw new Error("Invalid target status");

  const supabase = await createClient();
  const { data: row } = await supabase
    .from("equipment")
    .select("equipment_state")
    .eq("id", id)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!row) throw new Error("Equipment not found");
  const current = row.equipment_state as z.infer<typeof StatusEnum>;
  const allowed = EQUIPMENT_TRANSITIONS[current] ?? [];
  if (!allowed.includes(next.data)) {
    throw new Error(`Cannot move ${current} → ${next.data}. Allowed: ${allowed.join(", ") || "(terminal — retired)"}`);
  }

  // Conditional update closes the TOCTOU between SELECT and write.
  const { data: updated, error } = await supabase
    .from("equipment")
    .update({ equipment_state: next.data as EquipmentStatus })
    .eq("id", id)
    .eq("org_id", session.orgId)
    .eq("equipment_state", current)
    .select("id");
  if (error) throw new Error(error.message);
  if (!updated || updated.length === 0) {
    throw new Error("Equipment status changed concurrently — refresh and retry");
  }

  // Append to the LDP §3 asset_movements ledger — the equipment detail
  // page surfaces this as a movement timeline. Best-effort: a write
  // failure here shouldn't block the status transition (the equipment
  // row already moved) but it leaves the timeline incomplete, which is
  // a visible UI cue that something's off. Uses the loose client
  // because database.types.ts was generated against the 0019 shadowed
  // schema (asset_id) rather than the canonical 0016 (equipment_id +
  // org_id); migration 0060 enforces the canonical shape stays.
  const loose = supabase as unknown as LooseSupabase;
  void loose.from("asset_movements").insert({
    org_id: session.orgId,
    equipment_id: id,
    from_state: current,
    to_state: next.data,
    moved_by: session.userId,
    reason: null,
  });

  revalidatePath("/console/production/equipment");
  revalidatePath(`/console/production/equipment/${id}`);
}

export async function deleteEquipment(id: string): Promise<void> {
  const session = await requireSession();
  if (!id) return;
  const supabase = await createClient();
  // Soft-delete via deleted_at — equipment is referenced by rentals so a
  // hard delete would break referential integrity.
  const { error } = await supabase
    .from("equipment")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("org_id", session.orgId);
  if (error) throw new Error(`Could not update equipment: ${error.message}`);
  revalidatePath("/console/production/equipment");
  // No redirect — DeleteForm's undo flow navigates client-side after
  // showing the "Deleted" toast with its Undo action (REC-14).
}

const BulkIds = z.array(z.string().uuid()).min(1).max(200);

export type BulkResult = { message?: string; error?: string };

/**
 * Bulk soft-delete equipment — the list-table counterpart to
 * `deleteEquipment`. manager+ only; RLS pins every write to the session
 * org. Soft-delete via `deleted_at` (equipment is referenced by rentals,
 * so a hard delete would break referential integrity). Already-deleted /
 * cross-org / missing rows are skipped and reported.
 */
export async function bulkDeleteEquipment(ids: string[]): Promise<BulkResult> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "You Need Manager Access To Delete Equipment" };
  const parsed = BulkIds.safeParse(ids);
  if (!parsed.success) return { error: "Invalid Selection" };
  const supabase = await createClient();

  const { data: updated, error } = await supabase
    .from("equipment")
    .update({ deleted_at: new Date().toISOString() })
    .in("id", parsed.data)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .select("id");
  if (error) return { error: `Could Not Delete — ${error.message}` };

  const deleted = updated?.length ?? 0;
  const skipped = parsed.data.length - deleted;
  revalidatePath("/console/production/equipment");
  if (skipped > 0) {
    return { error: `${deleted} Deleted · ${skipped} Skipped (already deleted or not found)` };
  }
  return { message: `${deleted} ${deleted === 1 ? "Item" : "Items"} Deleted` };
}
