"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { actionFail, formFail } from "@/lib/forms/fail";

const Schema = z.object({
  name: z.string().min(1).max(120),
  contact_email: z.string().email().optional().or(z.literal("")),
  contact_phone: z.string().optional().or(z.literal("")),
  category: z.string().optional().or(z.literal("")),
  coi_expires_at: z.string().date().optional().or(z.literal("")),
  w9: z.string().optional(),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function createVendorAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Only manager+ can create vendors" };
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const supabase = await createClient();
  const { error } = await supabase.from("vendors").insert({
    org_id: session.orgId,
    name: parsed.data.name,
    contact_email: parsed.data.contact_email || null,
    contact_phone: parsed.data.contact_phone || null,
    category: parsed.data.category || null,
    coi_expires_at: parsed.data.coi_expires_at || null,
    w9_on_file: parsed.data.w9 === "on",
  });
  if (error) return actionFail(error.message, fd);
  revalidatePath("/studio/procurement/vendors");
  redirect("/studio/procurement/vendors");
}

const BulkIds = z.array(z.string().uuid()).min(1).max(200);

export type BulkResult = { message?: string; error?: string };

/**
 * Bulk soft-delete vendors — the list-table counterpart to per-vendor
 * management. manager+ only; RLS pins every write to the session org.
 * Soft-delete via `deleted_at` (vendors are referenced by requisitions /
 * POs, so a hard delete would break referential integrity). The
 * `database.types.ts` Vendor row predates the `deleted_at` column added
 * in the marketplace baseline, so this write goes through LooseSupabase;
 * the list page filters `deleted_at == null` to hide the soft-deleted
 * rows. Already-deleted / cross-org / missing rows are skipped and
 * reported.
 */
export async function bulkDeleteVendors(ids: string[]): Promise<BulkResult> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "You Need Manager Access To Delete Vendors" };
  const parsed = BulkIds.safeParse(ids);
  if (!parsed.success) return { error: "Invalid Selection" };
  const supabase = (await createClient()) as unknown as LooseSupabase;

  const { data: updated, error } = await supabase
    .from("vendors")
    .update({ deleted_at: new Date().toISOString() })
    .in("id", parsed.data)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .select("id");
  if (error) return { error: `Could Not Delete — ${error.message}` };

  const deleted = (updated as Array<{ id: string }> | null)?.length ?? 0;
  const skipped = parsed.data.length - deleted;
  revalidatePath("/studio/procurement/vendors");
  if (skipped > 0) {
    return { error: `${deleted} Deleted · ${skipped} Skipped (already deleted or not found)` };
  }
  return { message: `${deleted} ${deleted === 1 ? "Vendor" : "Vendors"} Deleted` };
}
