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

const CreateSchema = z.object({
  label: z.string().min(1).max(200),
  kind: z.enum(SUBSCRIPTION_KINDS),
  party_id: z.string().uuid().optional().or(z.literal("")),
  renewal_cadence_months: z.coerce.number().int().min(1).max(120).optional(),
  trial_days: z.coerce.number().int().min(0).max(365).optional(),
});

export type State = { error?: string } | null;

export async function createSubscriptionAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = CreateSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const supabase = await createClient();
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
  if (error) return { error: error.message };

  await supabase.from("subscription_state_transitions").insert({
    org_id: session.orgId,
    subscription_id: data.id,
    from_state: null,
    to_state: initialState,
    reason: "Created",
    transitioned_by: session.userId,
  });

  revalidatePath("/console/subscriptions");
  redirect(`/console/subscriptions/${data.id}`);
}

export async function transitionSubscriptionAction(id: string, to: SubscriptionState, reason?: string) {
  const session = await requireSession();
  if (!SUBSCRIPTION_STATES.includes(to)) return { error: "Invalid target state" };
  const result = await transitionSubscription({
    orgId: session.orgId,
    subscriptionId: id,
    to,
    reason,
    transitionedBy: session.userId,
  });
  if (!result.ok) return { error: result.error };
  revalidatePath(`/console/subscriptions/${id}`);
  revalidatePath("/console/subscriptions");
  return { ok: true as const };
}
