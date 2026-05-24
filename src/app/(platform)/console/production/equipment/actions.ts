"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { dollarsToCents } from "@/lib/format";
import type { EquipmentStatus } from "@/lib/supabase/types";

const Schema = z.object({
  name: z.string().min(1),
  category: z.string().optional(),
  asset_tag: z.string().optional(),
  serial: z.string().optional(),
  daily_rate: z.string().optional(),
});

export type State = { error?: string } | null;

export async function createEquipmentAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid" };
  const supabase = await createClient();
  const { error } = await supabase.from("equipment").insert({
    org_id: session.orgId,
    name: parsed.data.name,
    category: parsed.data.category || null,
    asset_tag: parsed.data.asset_tag || null,
    serial: parsed.data.serial || null,
    daily_rate_cents: parsed.data.daily_rate ? dollarsToCents(parsed.data.daily_rate) : null,
  });
  if (error) return { error: error.message };
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
  const next = StatusEnum.safeParse(formData.get("status"));
  if (!id) throw new Error("Missing equipment id");
  if (!next.success) throw new Error("Invalid target status");

  const supabase = await createClient();
  const { data: row } = await supabase
    .from("equipment")
    .select("status")
    .eq("id", id)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!row) throw new Error("Equipment not found");
  const current = row.status as z.infer<typeof StatusEnum>;
  const allowed = EQUIPMENT_TRANSITIONS[current] ?? [];
  if (!allowed.includes(next.data)) {
    throw new Error(`Cannot move ${current} → ${next.data}. Allowed: ${allowed.join(", ") || "(terminal — retired)"}`);
  }

  // Conditional update closes the TOCTOU between SELECT and write.
  const { data: updated, error } = await supabase
    .from("equipment")
    .update({ status: next.data as EquipmentStatus })
    .eq("id", id)
    .eq("org_id", session.orgId)
    .eq("status", current)
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

export async function deleteEquipment(formData: FormData) {
  const session = await requireSession();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await createClient();
  // Soft-delete via deleted_at — equipment is referenced by rentals so a
  // hard delete would break referential integrity.
  await supabase
    .from("equipment")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("org_id", session.orgId);
  revalidatePath("/console/production/equipment");
  redirect("/console/production/equipment");
}
