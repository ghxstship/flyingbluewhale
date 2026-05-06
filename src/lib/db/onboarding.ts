import "server-only";
import { createClient } from "@/lib/supabase/server";

export type OnboardingStepStatus = "pending" | "in_progress" | "done" | "waived" | "blocked";

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
  status: OnboardingStepStatus;
  completed_at: string | null;
  completed_by: string | null;
  notes: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export async function listOnboardingSteps(letterId: string): Promise<OnboardingStep[]> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const q: any = (supabase as unknown as { from: (t: string) => any }).from("onboarding_steps");
  const { data, error } = await q.select("*").eq("offer_letter_id", letterId).order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as OnboardingStep[];
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
      done: steps.filter((s) => s.status === "done" || s.status === "waived").length,
      critical_path_open: steps.filter((s) => s.critical_path && s.status !== "done" && s.status !== "waived").length,
    });
  }
  return out;
}

export async function setStepStatus(stepId: string, status: OnboardingStepStatus, userId?: string): Promise<void> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const q: any = (supabase as unknown as { from: (t: string) => any }).from("onboarding_steps");
  const { error } = await q
    .update({
      status,
      completed_at: status === "done" || status === "waived" ? new Date().toISOString() : null,
      completed_by: status === "done" || status === "waived" ? (userId ?? null) : null,
    })
    .eq("id", stepId);
  if (error) throw error;
}

export async function recordCheckIn(letterId: string, ip: string | null, userAgent: string | null): Promise<void> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb: any = supabase as unknown as { from: (t: string) => any };

  // Find the venue_checkin step and mark done.
  const { data: steps, error } = await sb
    .from("onboarding_steps")
    .select("id")
    .eq("offer_letter_id", letterId)
    .eq("step_key", "venue_checkin")
    .limit(1);
  if (error) throw error;
  if (steps && steps.length) {
    await sb
      .from("onboarding_steps")
      .update({
        status: "done",
        completed_at: new Date().toISOString(),
        notes: `Checked in via QR — ip=${ip ?? "unknown"} ua=${userAgent?.slice(0, 80) ?? "unknown"}`,
      })
      .eq("id", steps[0].id);
  }

  // Append to signature_audit jsonb
  await sb.rpc("noop"); // not strictly needed; placeholder if a function exists.
}
