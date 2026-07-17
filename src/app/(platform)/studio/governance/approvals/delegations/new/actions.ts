"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ensureMyPartyId, ensurePartyForMember } from "@/lib/db/parties";
import { actionFail, formFail } from "@/lib/forms/fail";
import { DELEGATION_SCOPES } from "@/lib/approvals/queries";

const Schema = z.object({
  delegatee_user_id: z.string().uuid("Pick a delegatee"),
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

  // Both columns hold parties.id — resolve through the party layer. The
  // delegatee must be a member of this org (org-checked in the helper).
  const delegatorPartyId = await ensureMyPartyId(session.orgId, session.userId, session.email);
  if (!delegatorPartyId) return actionFail("Could not resolve your party record in this workspace", fd);
  const delegateePartyId = await ensurePartyForMember(session.orgId, parsed.data.delegatee_user_id);
  if (!delegateePartyId) return actionFail("Selected delegatee is not a member of this workspace", fd);

  const { error } = await supabase.from("approval_delegations").insert({
    org_id: session.orgId,
    delegator_party_id: delegatorPartyId,
    delegatee_party_id: delegateePartyId,
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
