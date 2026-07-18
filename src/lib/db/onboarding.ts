import "server-only";
import { createClient } from "@/lib/supabase/server";

export type OnboardingStepState = "pending" | "in_progress" | "done" | "waived" | "blocked";

export type OnboardingStep = {
  id: string;
  org_id: string;
  offer_letter_id: string;
  step_key: string;
  title: string;
  description: string | null;
  category: string | null;
  critical_path: boolean;
  sort_order: number;
  due_at: string | null;
  step_state: OnboardingStepState;
  completed_at: string | null;
  completed_by: string | null;
  notes: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export async function listOnboardingSteps(letterId: string): Promise<OnboardingStep[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("onboarding_steps")
    .select("*")
    .eq("offer_letter_id", letterId)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as OnboardingStep[];
}

export async function listOnboardingByProject(
  orgId: string,
  projectId: string,
): Promise<
  {
    letter_id: string;
    recipient_name: string;
    total: number;
    done: number;
    critical_path_open: number;
  }[]
> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("offer_letters_resolved")
    .select("id, recipient_name")
    .eq("org_id", orgId)
    .eq("project_id", projectId)
    .neq("status", "withdrawn");
  if (error) throw error;
  if (!data) return [];

  const letters = data as Array<{ id: string; recipient_name: string }>;
  const out: Array<{
    letter_id: string;
    recipient_name: string;
    total: number;
    done: number;
    critical_path_open: number;
  }> = [];
  // Single batched query instead of one round trip per letter (N+1).
  const letterIds = letters.map((l) => l.id);
  const supabase2 = await createClient();
  const { data: allSteps, error: stepsErr } = await supabase2
    .from("onboarding_steps")
    .select("*")
    .in("offer_letter_id", letterIds)
    .order("sort_order", { ascending: true });
  if (stepsErr) throw stepsErr;
  const stepsByLetter = new Map<string, OnboardingStep[]>();
  for (const row of (allSteps ?? []) as unknown as OnboardingStep[]) {
    const key = (row as unknown as { offer_letter_id: string }).offer_letter_id;
    const bucket = stepsByLetter.get(key) ?? [];
    bucket.push(row);
    stepsByLetter.set(key, bucket);
  }
  for (const l of letters) {
    const steps = stepsByLetter.get(l.id) ?? [];
    out.push({
      letter_id: l.id,
      recipient_name: l.recipient_name,
      total: steps.length,
      done: steps.filter((s) => s.step_state === "done" || s.step_state === "waived").length,
      critical_path_open: steps.filter((s) => s.critical_path && s.step_state !== "done" && s.step_state !== "waived")
        .length,
    });
  }
  return out;
}

// ── Kit 30 — lifecycle onboarding packet template ───────────────────────────
// The 4-doc packet every engagement ships with. ★ critical-path docs gate
// arrival; Pre-Arrival Confirmation stays `blocked` until Know Before You Go
// completes (the dependency is recorded in metadata.blocked_by and released
// by `unblockDependentSteps`). No new engine — these are ordinary
// onboarding_steps rows riding the existing pending / in_progress / done /
// waived / blocked states.

export type LifecyclePacketDoc = {
  step_key: string;
  title: string;
  category: string;
  critical_path: boolean;
  sort_order: number;
  /** step_key of the doc that must complete before this one unlocks. */
  blocked_by: string | null;
};

export const LIFECYCLE_PACKET: readonly LifecyclePacketDoc[] = [
  { step_key: "job_description", title: "Job Description", category: "packet", critical_path: false, sort_order: 10, blocked_by: null },
  { step_key: "offer_letter", title: "Offer Letter", category: "packet", critical_path: true, sort_order: 20, blocked_by: null },
  { step_key: "know_before_you_go", title: "Know Before You Go", category: "packet", critical_path: false, sort_order: 30, blocked_by: null },
  { step_key: "pre_arrival_confirmation", title: "Pre-Arrival Confirmation", category: "packet", critical_path: true, sort_order: 40, blocked_by: "know_before_you_go" },
] as const;

/**
 * Idempotently seed the 4-doc lifecycle packet onto an offer letter.
 * Existing steps (any origin) are left untouched; only missing packet
 * docs are inserted, so the assign flow can call this on every save.
 * Uniqueness rides the (offer_letter_id, step_key) constraint.
 */
export async function ensureLifecyclePacket(orgId: string, letterId: string): Promise<void> {
  const supabase = await createClient();
  const { data: existing, error } = await supabase
    .from("onboarding_steps")
    .select("step_key")
    .eq("offer_letter_id", letterId);
  if (error) throw error;
  const have = new Set(((existing ?? []) as Array<{ step_key: string }>).map((s) => s.step_key));
  const missing = LIFECYCLE_PACKET.filter((d) => !have.has(d.step_key));
  if (missing.length === 0) return;

  const { error: insertErr } = await supabase.from("onboarding_steps").insert(
    missing.map((d) => ({
      org_id: orgId,
      offer_letter_id: letterId,
      step_key: d.step_key,
      title: d.title,
      critical_path: d.critical_path,
      sort_order: d.sort_order,
      step_state: d.blocked_by ? ("blocked" as const) : ("pending" as const),
      metadata: d.blocked_by ? { blocked_by: d.blocked_by } : {},
    })),
  );
  if (insertErr) throw insertErr;
}

/**
 * Release steps blocked on `completedStepKey` (metadata.blocked_by) once it
 * reaches a terminal state. blocked → pending, ledgered like every other
 * transition.
 */
export async function unblockDependentSteps(letterId: string, completedStepKey: string): Promise<void> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("onboarding_steps")
    .select("id, step_state, metadata")
    .eq("offer_letter_id", letterId)
    .eq("step_state", "blocked");
  if (error) throw error;
  const blocked = (data ?? []) as Array<{ id: string; step_state: OnboardingStepState; metadata: Record<string, unknown> | null }>;
  for (const step of blocked) {
    if ((step.metadata as { blocked_by?: string } | null)?.blocked_by !== completedStepKey) continue;
    await setStepState(step.id, "pending");
  }
}

export async function setStepState(stepId: string, nextState: OnboardingStepState, userId?: string): Promise<void> {
  const supabase = await createClient();
  const terminal = nextState === "done" || nextState === "waived";

  // Read the prior state so the transition-log row carries `from_state`.
  // LDP §SCHEMA PATTERNS DO: append-only ledger captures every edge.
  const { data: prior } = await supabase
    .from("onboarding_steps")
    .select("org_id, step_state")
    .eq("id", stepId)
    .maybeSingle();

  const { error } = await supabase
    .from("onboarding_steps")
    .update({
      step_state: nextState,
      completed_at: terminal ? new Date().toISOString() : null,
      completed_by: terminal ? (userId ?? null) : null,
    })
    .eq("id", stepId);
  if (error) throw error;

  if (prior && typeof prior === "object" && "org_id" in prior) {
    const p = prior as { org_id: string; step_state: OnboardingStepState };
    if (p.step_state !== nextState) {
      await supabase.from("onboarding_step_state_transitions").insert({
        org_id: p.org_id,
        step_id: stepId,
        from_state: p.step_state,
        to_state: nextState,
        transitioned_by: userId ?? null,
      });
    }
  }
}

export async function recordCheckIn(letterId: string, ip: string | null, userAgent: string | null): Promise<void> {
  const supabase = await createClient();

  // Find the venue_checkin step and mark done.
  const { data: steps, error } = await supabase
    .from("onboarding_steps")
    .select("id, org_id, step_state")
    .eq("offer_letter_id", letterId)
    .eq("step_key", "venue_checkin")
    .limit(1);
  if (error) throw error;
  if (steps && steps.length) {
    const row = steps[0] as { id: string; org_id: string; step_state: OnboardingStepState };
    await supabase
      .from("onboarding_steps")
      .update({
        step_state: "done",
        completed_at: new Date().toISOString(),
        notes: `Checked in via QR — ip=${ip ?? "unknown"} ua=${userAgent?.slice(0, 80) ?? "unknown"}`,
      })
      .eq("id", row.id);
    if (row.step_state !== "done") {
      await supabase.from("onboarding_step_state_transitions").insert({
        org_id: row.org_id,
        step_id: row.id,
        from_state: row.step_state,
        to_state: "done",
        reason: "venue_checkin QR scan",
      });
    }
  }
}

/**
 * Kit 30 (additive) — stamp a reminder on a step without touching its state.
 * `metadata.last_reminded_at` is what the packet screens render as
 * "Reminder Sent <date>"; the push itself is the caller's job (the lib stays
 * transport-free). Merges into the existing metadata rather than replacing it
 * so `blocked_by` and friends survive.
 */
export async function recordStepReminder(stepId: string): Promise<void> {
  const supabase = await createClient();
  const { data: prior, error: readErr } = await supabase
    .from("onboarding_steps")
    .select("metadata")
    .eq("id", stepId)
    .maybeSingle();
  if (readErr) throw readErr;
  const metadata = {
    ...(((prior?.metadata ?? {}) as Record<string, unknown>) || {}),
    last_reminded_at: new Date().toISOString(),
  };
  const { error } = await supabase.from("onboarding_steps").update({ metadata }).eq("id", stepId);
  if (error) throw error;
}
