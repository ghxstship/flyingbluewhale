"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { updateOrgScopedWithCheck, STALE_ROW_MESSAGE } from "@/lib/db/concurrency";
import { formFail } from "@/lib/forms/fail";
import { dependentsBlockMessage, isDependentsBlock } from "@/lib/db/separation";
import { actionErrorMessage } from "@/lib/errors";

const Schema = z.object({
  name: z.string().min(1).max(200),
  role: z.string().max(120).optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(40).optional().or(z.literal("")),
  day_rate_cents: z.string().optional(),
  notes: z.string().max(2000).optional().or(z.literal("")),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function updateCrewMember(id: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  // Sea Trial FINDING-022: optimistic concurrency.
  const expectedUpdatedAt = String(fd.get("_updated_at") ?? "");
  const result = await updateOrgScopedWithCheck("crew_members", session.orgId, id, expectedUpdatedAt, {
    name: parsed.data.name,
    role: parsed.data.role || null,
    email: parsed.data.email || null,
    phone: parsed.data.phone || null,
    day_rate_cents: parsed.data.day_rate_cents ? Number(parsed.data.day_rate_cents) : null,
    notes: parsed.data.notes || null,
  });
  if (!result.ok) {
    return { error: result.reason === "stale" ? STALE_ROW_MESSAGE : actionErrorMessage("not-found.crew-member", "Crew Member not found.") };
  }
  revalidatePath(`/studio/people/crew/${id}`);
  revalidatePath("/studio/people/crew");
  redirect(`/studio/people/crew/${id}`);
}

/**
 * DELETE — only for a record that never engaged.
 *
 * A crew member with history is archived via `separateCrewMember`, not erased:
 * deleting one CASCADES their credentials, certifications, ratings and MSA, and
 * SET NULLs their assignments, shifts and safety briefings. The rule is enforced
 * by a BEFORE DELETE trigger in the database (see @/lib/db/separation) — this is
 * only the translation of its refusal into something an operator can act on.
 */
export async function deleteCrewMember(id: string): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  const { error } = await supabase.from("crew_members").delete().eq("id", id).eq("org_id", session.orgId);
  if (error) {
    if (isDependentsBlock(error)) throw new Error(dependentsBlockMessage(error));
    throw new Error(`Could not delete crew member: ${error.message}`);
  }
  revalidatePath("/studio/people/crew");
  redirect("/studio/people/crew");
}

/**
 * SEPARATE — the offboarding mirror of onboarding (new_hire_flows had no
 * counterpart; separation used to be a plain DELETE, which erased the person
 * along with any record that they ever worked here).
 *
 * Preserves the roster row and stamps WHEN + WHY, so history survives for
 * compliance and re-engagement is a state flip rather than a re-create. LDP:
 * `engagement_state` is the cyclical lifecycle (active <-> separated).
 */
export async function separateCrewMember(id: string, reason?: string): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  const { error } = await supabase
    .from("crew_members")
    .update({
      engagement_state: "separated",
      separated_at: new Date().toISOString(),
      separation_reason: reason?.trim() || null,
    })
    .eq("id", id)
    .eq("org_id", session.orgId);
  if (error) throw new Error(`Could not separate crew member: ${error.message}`);
  revalidatePath(`/studio/people/crew/${id}`);
  revalidatePath("/studio/people/crew");
  redirect(`/studio/people/crew/${id}`);
}

/** REINSTATE — re-engagement flips the state back and clears the separation stamps. */
export async function reinstateCrewMember(id: string): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  const { error } = await supabase
    .from("crew_members")
    .update({ engagement_state: "active", separated_at: null, separation_reason: null })
    .eq("id", id)
    .eq("org_id", session.orgId);
  if (error) throw new Error(`Could not reinstate crew member: ${error.message}`);
  revalidatePath(`/studio/people/crew/${id}`);
  revalidatePath("/studio/people/crew");
  redirect(`/studio/people/crew/${id}`);
}
