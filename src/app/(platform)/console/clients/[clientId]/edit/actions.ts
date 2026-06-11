"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { updateOrgScopedWithCheck, STALE_ROW_MESSAGE } from "@/lib/db/concurrency";
import { formFail } from "@/lib/forms/fail";

const Schema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  contact_email: z.string().email().optional().or(z.literal("")),
  contact_phone: z.string().max(40).optional().or(z.literal("")),
  website: z.string().max(300).optional().or(z.literal("")),
  notes: z.string().max(4000).optional().or(z.literal("")),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function updateClient(id: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  // Sea Trial FINDING-022: optimistic concurrency.
  const expectedUpdatedAt = String(fd.get("_updated_at") ?? "");
  const result = await updateOrgScopedWithCheck("clients", session.orgId, id, expectedUpdatedAt, {
    name: parsed.data.name,
    contact_email: parsed.data.contact_email || null,
    contact_phone: parsed.data.contact_phone || null,
    website: parsed.data.website || null,
    notes: parsed.data.notes || null,
  });
  if (!result.ok) {
    return { error: result.reason === "stale" ? STALE_ROW_MESSAGE : "Client not found." };
  }
  revalidatePath(`/console/clients/${id}`);
  revalidatePath("/console/clients");
  redirect(`/console/clients/${id}`);
}

export async function deleteClient(id: string): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  // SOFT delete to match projects/memberships pattern. Hard delete
  // cascaded onto clients FK references (proposals, invoices, etc),
  // breaking historical reporting; soft delete preserves the record
  // and the .is("deleted_at", null) below makes the action
  // idempotent.
  const { error } = await supabase
    .from("clients")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("org_id", session.orgId)
    .is("deleted_at", null);
  if (error) throw new Error(`Could not update client: ${error.message}`);
  revalidatePath("/console/clients");
  // No redirect — DeleteForm's undo flow navigates client-side after
  // showing the "Deleted" toast with its Undo action (REC-14).
}
