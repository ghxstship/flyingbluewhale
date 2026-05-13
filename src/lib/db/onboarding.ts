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
  for (const l of letters) {
    const steps = await listOnboardingSteps(l.id);
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
