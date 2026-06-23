"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

async function guardFlow(flowId: string, orgId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("new_hire_flows")
    .select("id")
    .eq("id", flowId)
    .eq("org_id", orgId)
    .is("deleted_at", null)
    .maybeSingle();
  return !!data;
}

const StepSchema = z.object({
  flowId: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional().or(z.literal("")),
  step_kind: z.enum(["read", "sign", "upload", "quiz", "course", "form"]),
});

export async function addStep(fd: FormData): Promise<void> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return;
  const parsed = StepSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid input");
  if (!(await guardFlow(parsed.data.flowId, session.orgId))) return;
  const supabase = await createClient();

  // Ordinal: next-after-max keeps display order stable when steps are
  // deleted (we'd need re-numbering only if we expose reordering).
  const { count } = await supabase
    .from("new_hire_flow_steps")
    .select("id", { count: "exact", head: true })
    .eq("flow_id", parsed.data.flowId);
  const { error } = await supabase.from("new_hire_flow_steps").insert({
    flow_id: parsed.data.flowId,
    ordinal: (count ?? 0) + 1,
    title: parsed.data.title,
    description: parsed.data.description || null,
    step_kind: parsed.data.step_kind,
    required: true,
  });
  if (error) throw new Error(`Could not create new hire flow step: ${error.message}`);
  revalidatePath(`/studio/workforce/onboarding/${parsed.data.flowId}`);
}

const PubSchema = z.object({ flowId: z.string().uuid() });

export async function publishFlow(fd: FormData): Promise<void> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return;
  const parsed = PubSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid input");
  if (!(await guardFlow(parsed.data.flowId, session.orgId))) return;
  const supabase = await createClient();
  const { error } = await supabase
    .from("new_hire_flows")
    .update({ publish_state: "published" })
    .eq("id", parsed.data.flowId)
    .eq("org_id", session.orgId)
    .eq("publish_state", "draft");
  if (error) throw new Error(`Could not update new hire flow: ${error.message}`);
  revalidatePath(`/studio/workforce/onboarding/${parsed.data.flowId}`);
  revalidatePath("/studio/workforce/onboarding");
}

const AssignSchema = z.object({
  flowId: z.string().uuid(),
  assignee_id: z.string().uuid(),
});

export async function assignFlow(fd: FormData): Promise<void> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return;
  const parsed = AssignSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid input");
  if (!(await guardFlow(parsed.data.flowId, session.orgId))) return;
  const supabase = await createClient();

  // Assignee must be an org member.
  const { data: member } = await supabase
    .from("memberships")
    .select("user_id")
    .eq("org_id", session.orgId)
    .eq("user_id", parsed.data.assignee_id)
    .is("deleted_at", null)
    .maybeSingle();
  if (!member) return;

  const { error } = await supabase.from("new_hire_assignments").insert({
    org_id: session.orgId,
    flow_id: parsed.data.flowId,
    assignee_id: parsed.data.assignee_id,
  });
  if (error) throw new Error(`Could not create new hire assignment: ${error.message}`);
  revalidatePath(`/studio/workforce/onboarding/${parsed.data.flowId}`);
}
