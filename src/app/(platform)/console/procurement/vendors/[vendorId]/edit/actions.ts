"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { updateOrgScopedWithCheck, STALE_ROW_MESSAGE } from "@/lib/db/concurrency";

const Schema = z.object({
  name: z.string().min(1).max(200),
  category: z.string().max(120).optional().or(z.literal("")),
  contact_email: z.string().email().optional().or(z.literal("")),
  contact_phone: z.string().max(40).optional().or(z.literal("")),
  coi_expires_at: z.string().optional().or(z.literal("")),
  notes: z.string().max(4000).optional().or(z.literal("")),
});

export type State = { error?: string } | null;

export async function updateVendor(id: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  // Sea Trial FINDING-022: optimistic concurrency.
  const expectedUpdatedAt = String(fd.get("_updated_at") ?? "");
  const result = await updateOrgScopedWithCheck("vendors", session.orgId, id, expectedUpdatedAt, {
    name: parsed.data.name,
    category: parsed.data.category || null,
    contact_email: parsed.data.contact_email || null,
    contact_phone: parsed.data.contact_phone || null,
    coi_expires_at: parsed.data.coi_expires_at || null,
    notes: parsed.data.notes || null,
  });
  if (!result.ok) {
    return { error: result.reason === "stale" ? STALE_ROW_MESSAGE : "Vendor not found." };
  }
  revalidatePath(`/console/procurement/vendors/${id}`);
  revalidatePath("/console/procurement/vendors");
  redirect(`/console/procurement/vendors/${id}`);
}

export async function deleteVendor(id: string): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  // SOFT delete — vendors has a deleted_at tombstone column. Hard-
  // deleting cascades onto purchase_orders, expenses, and rfqs
  // referencing the vendor, breaking historical procurement reports.
  // Soft delete preserves the record; .is(deleted_at, null) makes
  // the action idempotent.
  const { error } = await supabase
    .from("vendors")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("org_id", session.orgId)
    .is("deleted_at", null);
  if (error) throw new Error(`Could not archive vendor: ${error.message}`);
  revalidatePath("/console/procurement/vendors");
  redirect("/console/procurement/vendors");
}
