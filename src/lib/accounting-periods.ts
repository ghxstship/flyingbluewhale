/**
 * Accounting Periods SDK — typed wrapper for the LDP §7 Financial Period Lifecycle.
 *
 * Schema: accounting_periods (USNP canon, shipped 2026-05-08) + accounting_period_state
 * typed column added 2026-05-09 + accounting_period_state_transitions append-only log.
 *
 * Lifecycle: OPEN -> IN_PERIOD -> CLOSING -> CLOSED -> AUDITED -> ARCHIVED
 *
 * Critical attribute (LDP §7): CLOSED periods cannot receive new journal entries.
 * Corrections require reversing entries in the open period referencing the
 * closed entry. AUDITED is post-external-audit historical state freeze.
 */

import "server-only";
import { createClient } from "@/lib/supabase/server";

export const ACCOUNTING_PERIOD_STATES = ["OPEN", "IN_PERIOD", "CLOSING", "CLOSED", "AUDITED", "ARCHIVED"] as const;
export type AccountingPeriodState = (typeof ACCOUNTING_PERIOD_STATES)[number];

export type AccountingPeriod = {
  id: string;
  org_id: string;
  period_label: string;
  starts_on: string;
  ends_on: string;
  state: AccountingPeriodState;
  status: string; // legacy text column kept for back-compat during migration window
  closed_at: string | null;
  closed_by: string | null;
  created_at: string;
};

export type AccountingPeriodTransition = {
  id: string;
  org_id: string;
  accounting_period_id: string;
  from_state: AccountingPeriodState | null;
  to_state: AccountingPeriodState;
  transitioned_at: string;
  transitioned_by: string | null;
  reason: string | null;
  correlation_id: string | null;
};

export const ACCOUNTING_PERIOD_TRANSITION_GRAPH: Record<AccountingPeriodState, readonly AccountingPeriodState[]> = {
  OPEN: ["IN_PERIOD", "CLOSING", "ARCHIVED"],
  IN_PERIOD: ["CLOSING", "ARCHIVED"],
  CLOSING: ["CLOSED", "OPEN"],
  CLOSED: ["AUDITED", "ARCHIVED"],
  AUDITED: ["ARCHIVED"],
  ARCHIVED: [],
};

export function canTransition(from: AccountingPeriodState, to: AccountingPeriodState): boolean {
  return ACCOUNTING_PERIOD_TRANSITION_GRAPH[from].includes(to);
}

export async function listAccountingPeriods(orgId: string): Promise<AccountingPeriod[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("accounting_periods")
    .select("*")
    .eq("org_id", orgId)
    .order("ends_on", { ascending: false });
  if (error) throw new Error(`listAccountingPeriods: ${error.message}`);
  return (data ?? []) as AccountingPeriod[];
}

export async function getAccountingPeriod(orgId: string, id: string): Promise<AccountingPeriod | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("accounting_periods")
    .select("*")
    .eq("org_id", orgId)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`getAccountingPeriod: ${error.message}`);
  return (data ?? null) as AccountingPeriod | null;
}

export async function listAccountingPeriodTransitions(
  orgId: string,
  periodId: string,
): Promise<AccountingPeriodTransition[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("accounting_period_state_transitions")
    .select("*")
    .eq("org_id", orgId)
    .eq("accounting_period_id", periodId)
    .order("transitioned_at", { ascending: false });
  if (error) throw new Error(`listAccountingPeriodTransitions: ${error.message}`);
  return (data ?? []) as AccountingPeriodTransition[];
}

export async function transitionAccountingPeriod(args: {
  orgId: string;
  periodId: string;
  to: AccountingPeriodState;
  reason?: string;
  transitionedBy?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const current = await getAccountingPeriod(args.orgId, args.periodId);
  if (!current) return { ok: false, error: "Accounting period not found" };
  if (!canTransition(current.state, args.to)) {
    return { ok: false, error: `Cannot transition ${current.state} -> ${args.to}` };
  }

  const now = new Date().toISOString();
  const closeFields = args.to === "CLOSED" ? { closed_at: now, closed_by: args.transitionedBy ?? null } : {};

  const { error: updateError } = await supabase
    .from("accounting_periods")
    .update({ state: args.to, ...closeFields })
    .eq("org_id", args.orgId)
    .eq("id", args.periodId);
  if (updateError) return { ok: false, error: updateError.message };

  const { error: logError } = await supabase.from("accounting_period_state_transitions").insert({
    org_id: args.orgId,
    accounting_period_id: args.periodId,
    from_state: current.state,
    to_state: args.to,
    reason: args.reason ?? null,
    transitioned_by: args.transitionedBy ?? null,
  });
  if (logError) return { ok: false, error: logError.message };

  return { ok: true };
}
