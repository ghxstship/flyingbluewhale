"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { actionFail, formFail } from "@/lib/forms/fail";
import { actionErrorMessage } from "@/lib/errors";

const Schema = z.object({
  name: z.string().min(1).max(120),
  contact_email: z.string().email().optional().or(z.literal("")),
  contact_phone: z.string().max(40).optional().or(z.literal("")),
  website: z.string().url().optional().or(z.literal("")),
  notes: z.string().max(2000).optional(),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function createClientAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: actionErrorMessage("auth.manager-plus.create-clients", "Only manager+ can create clients") };
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clients")
    .insert({
      org_id: session.orgId,
      name: parsed.data.name,
      contact_email: parsed.data.contact_email || null,
      contact_phone: parsed.data.contact_phone || null,
      website: parsed.data.website || null,
      notes: parsed.data.notes || null,
      created_by: session.userId,
    })
    .select()
    .single();
  if (error) return actionFail(error.message, fd);
  revalidatePath("/studio/clients");
  redirect(`/studio/clients/${data.id}`);
}

const BulkIds = z.array(z.string().uuid()).min(1).max(200);

export type BulkResult = { message?: string; error?: string };

/**
 * Bulk soft-delete clients — the list-table counterpart to the per-row
 * delete. manager+ only; RLS pins every write to the session org. Rows
 * already deleted (or cross-org / missing) are skipped and reported, so
 * the toast tells the operator exactly what landed.
 */
export async function bulkDeleteClients(ids: string[]): Promise<BulkResult> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: actionErrorMessage("auth.manager.delete-clients", "You Need Manager Access To Delete Clients") };
  const parsed = BulkIds.safeParse(ids);
  if (!parsed.success) return { error: actionErrorMessage("invalid.selection", "Invalid Selection") };
  const supabase = await createClient();

  const { data: updated, error } = await supabase
    .from("clients")
    .update({ deleted_at: new Date().toISOString() })
    .in("id", parsed.data)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .select("id");
  if (error) return { error: `Could Not Delete: ${error.message}` };

  const deleted = updated?.length ?? 0;
  const skipped = parsed.data.length - deleted;
  revalidatePath("/studio/clients");
  if (skipped > 0) {
    return { error: `${deleted} Deleted · ${skipped} Skipped (already deleted or not found)` };
  }
  return { message: `${deleted} ${deleted === 1 ? "Client" : "Clients"} Deleted` };
}
