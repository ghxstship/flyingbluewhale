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
  const parsed = StepSchema.parse(Object.fromEntries(fd));
  if (!(await guardFlow(parsed.flowId, session.orgId))) return;
  const supabase = await createClient();

  // Ordinal: next-after-max keeps display order stable when steps are
  // deleted (we'd need re-numbering only if we expose reordering).
  const { count } = await supabase
    .from("new_hire_flow_steps")
    .select("id", { count: "exact", head: true })
    .eq("flow_id", parsed.flowId);
  await supabase.from("new_hire_flow_steps").insert({
    flow_id: parsed.flowId,
    ordinal: (count ?? 0) + 1,
    title: parsed.title,
    description: parsed.description || null,
    step_kind: parsed.step_kind,
    required: true,
  });
  revalidatePath(`/console/workforce/onboarding/${parsed.flowId}`);
}

const PubSchema = z.object({ flowId: z.string().uuid() });

export async function publishFlow(fd: FormData): Promise<void> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return;
  const parsed = PubSchema.parse(Object.fromEntries(fd));
  if (!(await guardFlow(parsed.flowId, session.orgId))) return;
  const supabase = await createClient();
  await supabase
    .from("new_hire_flows")
    .update({ publish_state: "published" })
    .eq("id", parsed.flowId)
    .eq("org_id", session.orgId)
    .eq("publish_state", "draft");
  revalidatePath(`/console/workforce/onboarding/${parsed.flowId}`);
  revalidatePath("/console/workforce/onboarding");
}

const AssignSchema = z.object({
  flowId: z.string().uuid(),
  assignee_id: z.string().uuid(),
});

export async function assignFlow(fd: FormData): Promise<void> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return;
  const parsed = AssignSchema.parse(Object.fromEntries(fd));
  if (!(await guardFlow(parsed.flowId, session.orgId))) return;
  const supabase = await createClient();

  // Assignee must be an org member.
  const { data: member } = await supabase
    .from("memberships")
    .select("user_id")
    .eq("org_id", session.orgId)
    .eq("user_id", parsed.assignee_id)
    .is("deleted_at", null)
    .maybeSingle();
  if (!member) return;

  await supabase.from("new_hire_assignments").insert({
    org_id: session.orgId,
    flow_id: parsed.flowId,
    assignee_id: parsed.assignee_id,
  });
  revalidatePath(`/console/workforce/onboarding/${parsed.flowId}`);
}
