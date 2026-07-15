"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { updateOrgScopedWithCheck, STALE_ROW_MESSAGE } from "@/lib/db/concurrency";
import { formFail } from "@/lib/forms/fail";

const Schema = z.object({
  full_name: z.string().min(1).max(200),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(40).optional().or(z.literal("")),
  role: z.string().max(120).optional().or(z.literal("")),
  kind: z.string(),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function updateStaffMember(id: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  // Sea Trial FINDING-022: optimistic concurrency.
  const expectedUpdatedAt = String(fd.get("_updated_at") ?? "");
  const result = await updateOrgScopedWithCheck("workforce_members", session.orgId, id, expectedUpdatedAt, {
    full_name: parsed.data.full_name,
    email: parsed.data.email || null,
    phone: parsed.data.phone || null,
    role: parsed.data.role || null,
    kind: parsed.data.kind as "paid_staff" | "volunteer" | "contractor" | "official",
  });
  if (!result.ok) {
    return { error: result.reason === "stale" ? STALE_ROW_MESSAGE : "Workforce Member not found." };
  }
  revalidatePath(`/studio/workforce/staff/${id}`);
  revalidatePath("/studio/workforce/staff");
  redirect(`/studio/workforce/staff/${id}`);
}

export async function deleteStaffMember(id: string): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  const { error } = await supabase.from("workforce_members").delete().eq("id", id).eq("org_id", session.orgId);
  if (error) throw new Error(`Could not delete workforce member: ${error.message}`);
  revalidatePath("/studio/workforce/staff");
  redirect("/studio/workforce/staff");
}

/**
 * SEPARATE — the offboarding mirror of onboarding (new_hire_flows had no
 * counterpart; separation used to be a plain DELETE, which erased the person
 * along with any record that they ever worked here).
 *
 * Preserves the row and stamps WHEN + WHY, so history survives for compliance
 * and re-engagement is a state flip rather than a re-create. LDP:
 * `engagement_state` is the cyclical lifecycle (active <-> separated).
 */
export async function separateStaffMember(id: string, reason?: string): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  const { error } = await supabase
    .from("workforce_members")
    .update({
      engagement_state: "separated",
      separated_at: new Date().toISOString(),
      separation_reason: reason?.trim() || null,
    })
    .eq("id", id)
    .eq("org_id", session.orgId);
  if (error) throw new Error(`Could not separate workforce member: ${error.message}`);
  revalidatePath(`/studio/workforce/staff/${id}`);
  revalidatePath("/studio/workforce/staff");
  redirect(`/studio/workforce/staff/${id}`);
}

/** REINSTATE — re-engagement flips the state back and clears the separation stamps. */
export async function reinstateStaffMember(id: string): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  const { error } = await supabase
    .from("workforce_members")
    .update({ engagement_state: "active", separated_at: null, separation_reason: null })
    .eq("id", id)
    .eq("org_id", session.orgId);
  if (error) throw new Error(`Could not reinstate workforce member: ${error.message}`);
  revalidatePath(`/studio/workforce/staff/${id}`);
  revalidatePath("/studio/workforce/staff");
  redirect(`/studio/workforce/staff/${id}`);
}
