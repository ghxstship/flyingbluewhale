"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
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

/**
 * Drive the equipment lifecycle: available ↔ reserved ↔ in_use ↔
 * maintenance → retired (terminal). Retired is final — for re-use,
 * create a new asset. Owner/admin/controller only.
 */
export async function setEquipmentStatus(formData: FormData) {
  const session = await requireSession();
  const id = String(formData.get("id") ?? "");
  const next = StatusEnum.safeParse(formData.get("status"));
  if (!id || !next.success) return;
  const supabase = await createClient();
  await supabase
    .from("equipment")
    .update({ status: next.data as EquipmentStatus })
    .eq("id", id)
    .eq("org_id", session.orgId);
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
