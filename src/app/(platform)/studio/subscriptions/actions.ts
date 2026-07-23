"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  SUBSCRIPTION_KINDS,
  SUBSCRIPTION_STATES,
  transitionSubscription,
  type SubscriptionState,
} from "@/lib/subscriptions";
import { actionFail, formFail } from "@/lib/forms/fail";
import { actionErrorMessage } from "@/lib/errors";

const CreateSchema = z.object({
  label: z.string().min(1).max(200),
  kind: z.enum(SUBSCRIPTION_KINDS),
  party_id: z.string().uuid().optional().or(z.literal("")),
  renewal_cadence_months: z.coerce.number().int().min(1).max(120).optional(),
  trial_days: z.coerce.number().int().min(0).max(365).optional(),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function createSubscriptionAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = CreateSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);

  const supabase = await createClient();

  // Cross-tenant FK guard on party_id. Parties live on the global
  // catalog (clients/vendors/talent) but each row is org-scoped.
  if (parsed.data.party_id) {
    const { data: party } = await supabase
      .from("parties")
      .select("id")
      .eq("id", parsed.data.party_id)
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .maybeSingle();
    if (!party) return { error: actionErrorMessage("not-found.party-in-org", "Party not found in your organization") };
  }
  const initialState: SubscriptionState = parsed.data.trial_days && parsed.data.trial_days > 0 ? "TRIAL" : "PROSPECT";
  const trialEndsAt = parsed.data.trial_days
    ? new Date(Date.now() + parsed.data.trial_days * 86400 * 1000).toISOString()
    : null;

  const { data, error } = await supabase
    .from("subscriptions")
    .insert({
      org_id: session.orgId,
      party_id: parsed.data.party_id || null,
      kind: parsed.data.kind,
      state: initialState,
      label: parsed.data.label,
      started_at: initialState === "TRIAL" ? new Date().toISOString() : null,
      trial_ends_at: trialEndsAt,
      renewal_cadence_months: parsed.data.renewal_cadence_months ?? null,
    })
    .select("id")
    .single();
  if (error) return actionFail(error.message, fd);

  const { error: insertError } = await supabase.from("subscription_state_transitions").insert({
    org_id: session.orgId,
    subscription_id: data.id,
    from_state: null,
    to_state: initialState,
    reason: "Created",
    transitioned_by: session.userId,
  });
  if (insertError) return actionFail(insertError.message, fd);

  revalidatePath("/studio/subscriptions");
  redirect(`/studio/subscriptions/${data.id}`);
}

export async function transitionSubscriptionAction(id: string, to: SubscriptionState, reason?: string) {
  const session = await requireSession();
  if (!SUBSCRIPTION_STATES.includes(to)) return { error: actionErrorMessage("invalid.target-state", "Invalid target state") };
  const result = await transitionSubscription({
    orgId: session.orgId,
    subscriptionId: id,
    to,
    reason,
    transitionedBy: session.userId,
  });
  if (!result.ok) return { error: result.error };
  revalidatePath(`/studio/subscriptions/${id}`);
  revalidatePath("/studio/subscriptions");
  return { ok: true as const };
}
