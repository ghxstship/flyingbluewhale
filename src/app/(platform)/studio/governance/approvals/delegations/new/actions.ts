"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { actionFail, formFail } from "@/lib/forms/fail";
import { DELEGATION_SCOPES } from "@/lib/approvals/queries";

const Schema = z.object({
  delegatee_party_id: z.string().uuid("Pick a delegatee or paste a valid user id"),
  scope: z.enum(DELEGATION_SCOPES),
  scope_ref: z.string().max(200).optional().or(z.literal("")),
  starts_at: z.string().optional().or(z.literal("")),
  ends_at: z.string().optional().or(z.literal("")),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function createDelegation(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Only manager+ can create approval delegations" };
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const supabase = await createClient();

  const { error } = await supabase.from("approval_delegations").insert({
    org_id: session.orgId,
    // party_id columns have no FK → delegator maps to the current user.
    delegator_party_id: session.userId,
    delegatee_party_id: parsed.data.delegatee_party_id,
    scope: parsed.data.scope,
    scope_ref: parsed.data.scope_ref || null,
    // starts_at defaults now() when omitted; active defaults true.
    ...(parsed.data.starts_at ? { starts_at: new Date(parsed.data.starts_at).toISOString() } : {}),
    ends_at: parsed.data.ends_at ? new Date(parsed.data.ends_at).toISOString() : null,
  });
  if (error) return actionFail(error.message, fd);

  revalidatePath("/studio/governance/approvals/delegations");
  redirect("/studio/governance/approvals/delegations");
}
