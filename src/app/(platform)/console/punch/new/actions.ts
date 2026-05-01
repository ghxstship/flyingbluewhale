"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { nextOrgCode } from "@/lib/codes";

const Schema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(4000).optional(),
  project_id: z.string().uuid(),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
  assignee_id: z.string().uuid().optional().or(z.literal("")),
  vendor_id: z.string().uuid().optional().or(z.literal("")),
  due_at: z.string().optional(),
  site_plan_id: z.string().uuid().optional().or(z.literal("")),
  show_ready_gate: z.string().optional(),
});

export type State = { error?: string } | null;

export async function createPunchItem(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const supabase = await createClient();
  const code = await nextOrgCode("punch_items", session.orgId, "PUNCH");

  const { data, error } = await supabase
    .from("punch_items")
    .insert({
      org_id: session.orgId,
      code,
      title: parsed.data.title,
      description: parsed.data.description || null,
      project_id: parsed.data.project_id,
      priority: parsed.data.priority,
      assignee_id: parsed.data.assignee_id || null,
      vendor_id: parsed.data.vendor_id || null,
      due_at: parsed.data.due_at || null,
      site_plan_id: parsed.data.site_plan_id || null,
      show_ready_gate: parsed.data.show_ready_gate === "1",
      created_by: session.userId,
    } as never)
    .select("id")
    .single();
  if (error) return { error: error.message };
  revalidatePath("/console/punch");
  redirect(`/console/punch/${data.id}`);
}
