/**
 * Subscriptions SDK — typed wrapper for the LDP §8 Subscription Lifecycle.
 *
 * Schema: subscriptions table + subscription_state_transitions append-only log
 * (added 2026-05-09 in migration 20260509060000_ldp_lifecycle_remediations_reconciled).
 *
 * Lifecycle: PROSPECT -> TRIAL -> ACTIVE -> RENEWED -> LAPSED -> REACTIVATED | CHURNED -> ARCHIVED
 */

import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

/**
 * The subscriptions table is RLS-gated on `has_org_role(...)` for SELECT and
 * UPDATE. In-app callers run as the authed user (RLS client). The Stripe
 * webhook has NO session, so it MUST inject the service-role client — passing
 * the RLS client there makes every read return null and every transition
 * silently no-op. Callers pass the appropriate client via `db`.
 */
type Db = SupabaseClient<Database>;

export const SUBSCRIPTION_STATES = [
  "PROSPECT",
  "TRIAL",
  "ACTIVE",
  "RENEWED",
  "LAPSED",
  "REACTIVATED",
  "CHURNED",
  "ARCHIVED",
] as const;
export type SubscriptionState = (typeof SUBSCRIPTION_STATES)[number];

export const SUBSCRIPTION_KINDS = ["MEMBER", "RETAINER", "RECURRING_SPONSOR", "PLATFORM_PLAN"] as const;
export type SubscriptionKind = (typeof SUBSCRIPTION_KINDS)[number];

export type Subscription = {
  id: string;
  org_id: string;
  party_id: string | null;
  kind: SubscriptionKind;
  state: SubscriptionState;
  label: string;
  started_at: string | null;
  trial_ends_at: string | null;
  renewed_at: string | null;
  lapsed_at: string | null;
  reactivated_at: string | null;
  churned_at: string | null;
  archived_at: string | null;
  renewal_cadence_months: number | null;
  stripe_subscription_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type SubscriptionTransition = {
  id: string;
  org_id: string;
  subscription_id: string;
  from_state: SubscriptionState | null;
  to_state: SubscriptionState;
  transitioned_at: string;
  transitioned_by: string | null;
  reason: string | null;
  correlation_id: string | null;
  stripe_event_id: string | null;
};

/** Allowed forward transitions per LDP §8 critical attributes. LAPSED → REACTIVATED is recoverable. */
export const SUBSCRIPTION_TRANSITION_GRAPH: Record<SubscriptionState, readonly SubscriptionState[]> = {
  PROSPECT: ["TRIAL", "ACTIVE", "ARCHIVED"],
  TRIAL: ["ACTIVE", "CHURNED", "ARCHIVED"],
  ACTIVE: ["RENEWED", "LAPSED", "CHURNED", "ARCHIVED"],
  RENEWED: ["RENEWED", "LAPSED", "CHURNED", "ARCHIVED"],
  LAPSED: ["REACTIVATED", "CHURNED", "ARCHIVED"],
  REACTIVATED: ["RENEWED", "LAPSED", "CHURNED", "ARCHIVED"],
  CHURNED: ["ARCHIVED"],
  ARCHIVED: [],
};

export function canTransition(from: SubscriptionState, to: SubscriptionState): boolean {
  return SUBSCRIPTION_TRANSITION_GRAPH[from].includes(to);
}

export async function listSubscriptions(orgId: string): Promise<Subscription[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("org_id", orgId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`listSubscriptions: ${error.message}`);
  return (data ?? []) as Subscription[];
}

export async function getSubscription(orgId: string, id: string, db?: Db): Promise<Subscription | null> {
  const supabase = db ?? (await createClient());
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("org_id", orgId)
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw new Error(`getSubscription: ${error.message}`);
  return (data ?? null) as Subscription | null;
}

export async function listSubscriptionTransitions(
  orgId: string,
  subscriptionId: string,
): Promise<SubscriptionTransition[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("subscription_state_transitions")
    .select("*")
    .eq("org_id", orgId)
    .eq("subscription_id", subscriptionId)
    .order("transitioned_at", { ascending: false });
  if (error) throw new Error(`listSubscriptionTransitions: ${error.message}`);
  return (data ?? []) as SubscriptionTransition[];
}

/**
 * Transition a subscription to a new state. Validates the transition graph,
 * updates the subscription row, and appends a transition log entry.
 *
 * The subscription's lifecycle-event timestamp columns (started_at,
 * renewed_at, lapsed_at, etc) are populated automatically based on `to`.
 */
export async function transitionSubscription(args: {
  orgId: string;
  subscriptionId: string;
  to: SubscriptionState;
  reason?: string;
  transitionedBy?: string;
  stripeEventId?: string;
  /**
   * Supabase client to run under. Omit for in-app (authed) callers — they get
   * the RLS-scoped client so user-initiated transitions still enforce
   * `has_org_role`. The Stripe webhook MUST pass `createServiceClient()`: it
   * has no session, and the RLS client would make every read/update no-op.
   */
  db?: Db;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = args.db ?? (await createClient());
  const current = await getSubscription(args.orgId, args.subscriptionId, supabase);
  if (!current) return { ok: false, error: "Subscription not found" };
  if (!canTransition(current.state, args.to)) {
    return { ok: false, error: `Cannot transition ${current.state} -> ${args.to}` };
  }

  const now = new Date().toISOString();
  const timestampPatch: Record<string, string | null> = {};
  switch (args.to) {
    case "TRIAL":
    case "ACTIVE":
      if (!current.started_at) timestampPatch.started_at = now;
      break;
    case "RENEWED":
      timestampPatch.renewed_at = now;
      break;
    case "LAPSED":
      timestampPatch.lapsed_at = now;
      break;
    case "REACTIVATED":
      timestampPatch.reactivated_at = now;
      break;
    case "CHURNED":
      timestampPatch.churned_at = now;
      break;
    case "ARCHIVED":
      timestampPatch.archived_at = now;
      break;
  }

  // Conditional update: only land if the state observed above is still
  // the row's current state. Stripe webhooks arrive concurrently
  // (especially during dunning + cancel + reactivate cycles), so without
  // the guard we'd silently overwrite a newer transition with an older
  // one. The .select("id") tells us if our update actually landed.
  const { data: updated, error: updateError } = await supabase
    .from("subscriptions")
    .update({ state: args.to, ...timestampPatch })
    .eq("org_id", args.orgId)
    .eq("id", args.subscriptionId)
    .eq("state", current.state)
    .select("id");
  if (updateError) return { ok: false, error: updateError.message };
  if (!updated || updated.length === 0) {
    return { ok: false, error: "Subscription state changed concurrently — refresh and retry" };
  }

  const { error: logError } = await supabase.from("subscription_state_transitions").insert({
    org_id: args.orgId,
    subscription_id: args.subscriptionId,
    from_state: current.state,
    to_state: args.to,
    reason: args.reason ?? null,
    transitioned_by: args.transitionedBy ?? null,
    stripe_event_id: args.stripeEventId ?? null,
  });
  if (logError) return { ok: false, error: logError.message };

  return { ok: true };
}
