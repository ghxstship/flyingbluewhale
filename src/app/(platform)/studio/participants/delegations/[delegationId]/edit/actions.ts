"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { updateOrgScopedWithCheck, STALE_ROW_MESSAGE } from "@/lib/db/concurrency";
import { formFail } from "@/lib/forms/fail";

const Schema = z.object({
  name: z.string().min(1).max(200),
  code: z.string().min(1).max(40),
  country: z.string().max(120).optional().or(z.literal("")),
  contact_email: z.string().email().optional().or(z.literal("")),
  contact_phone: z.string().max(40).optional().or(z.literal("")),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function updateDelegation(id: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  // Sea Trial FINDING-022: optimistic concurrency.
  const expectedUpdatedAt = String(fd.get("_updated_at") ?? "");
  const result = await updateOrgScopedWithCheck("delegations", session.orgId, id, expectedUpdatedAt, {
    name: parsed.data.name,
    code: parsed.data.code,
    country: parsed.data.country || null,
    contact_email: parsed.data.contact_email || null,
    contact_phone: parsed.data.contact_phone || null,
  });
  if (!result.ok) {
    return { error: result.reason === "stale" ? STALE_ROW_MESSAGE : "Delegation not found." };
  }
  revalidatePath(`/studio/participants/delegations/${id}`);
  revalidatePath("/studio/participants/delegations");
  redirect(`/studio/participants/delegations/${id}`);
}

export async function deleteDelegation(id: string): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  const { error } = await supabase.from("delegations").delete().eq("id", id).eq("org_id", session.orgId);
  if (error) throw new Error(`Could not delete delegation: ${error.message}`);
  revalidatePath("/studio/participants/delegations");
  redirect("/studio/participants/delegations");
}
