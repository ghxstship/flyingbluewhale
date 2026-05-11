"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const StepSchema = z.object({
  assignmentId: z.string().uuid(),
  stepId: z.string().uuid(),
});

export async function completeStep(fd: FormData): Promise<void> {
  const session = await requireSession();
  const parsed = StepSchema.parse(Object.fromEntries(fd));
  const supabase = await createClient();

  // Caller must own the assignment.
  const { data: assignment } = await supabase
    .from("new_hire_assignments")
    .select("id, flow_id, progress, started_at, assignment_phase")
    .eq("id", parsed.assignmentId)
    .eq("assignee_id", session.userId)
    .maybeSingle();
  if (!assignment) return;
  const a = assignment as {
    id: string;
    flow_id: string;
    progress: Record<string, boolean> | null;
    started_at: string | null;
    assignment_phase: string;
  };

  // Step must belong to the assignment's flow.
  const { data: step } = await supabase
    .from("new_hire_flow_steps")
    .select("id")
    .eq("id", parsed.stepId)
    .eq("flow_id", a.flow_id)
    .maybeSingle();
  if (!step) return;

  const progress = { ...(a.progress ?? {}), [parsed.stepId]: true };
  await supabase
    .from("new_hire_assignments")
    .update({
      progress,
      assignment_phase: a.assignment_phase === "not_started" ? "in_progress" : a.assignment_phase,
      started_at: a.started_at ?? new Date().toISOString(),
    })
    .eq("id", parsed.assignmentId);

  revalidatePath(`/m/onboarding/${parsed.assignmentId}`);
  revalidatePath("/m/onboarding");
}

const FinalizeSchema = z.object({ assignmentId: z.string().uuid() });

export async function finalizeAssignment(fd: FormData): Promise<void> {
  const session = await requireSession();
  const parsed = FinalizeSchema.parse(Object.fromEntries(fd));
  const supabase = await createClient();

  const { data: assignment } = await supabase
    .from("new_hire_assignments")
    .select("id, flow_id, progress")
    .eq("id", parsed.assignmentId)
    .eq("assignee_id", session.userId)
    .maybeSingle();
  if (!assignment) return;
  const a = assignment as { id: string; flow_id: string; progress: Record<string, boolean> | null };

  // Verify every required step is done — re-check on the server so a
  // tampered form can't skip required steps.
  const { data: steps } = await supabase.from("new_hire_flow_steps").select("id, required").eq("flow_id", a.flow_id);
  const progress = (a.progress ?? {}) as Record<string, boolean>;
  const requiredDone = ((steps ?? []) as Array<{ id: string; required: boolean }>)
    .filter((s) => s.required)
    .every((s) => progress[s.id]);
  if (!requiredDone) return;

  await supabase
    .from("new_hire_assignments")
    .update({ assignment_phase: "completed", completed_at: new Date().toISOString() })
    .eq("id", parsed.assignmentId)
    .neq("assignment_phase", "completed");

  revalidatePath(`/m/onboarding/${parsed.assignmentId}`);
  revalidatePath("/m/onboarding");
}
