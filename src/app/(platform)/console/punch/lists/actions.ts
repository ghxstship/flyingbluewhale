"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const CreateSchema = z.object({
  // project_id is NOT NULL on punch_lists — a list always belongs to
  // a project. UI rejects "no project" rather than silently failing
  // at the DB layer.
  name: z.string().trim().min(1).max(160),
  project_id: z.string().uuid(),
  category: z.string().trim().max(80).optional().or(z.literal("")),
});

export async function createPunchList(fd: FormData): Promise<void> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return;
  const parsed = CreateSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return;

  const supabase = await createClient();
  // Cross-tenant guard for project_id. Without this, an unauthorised
  // project UUID would slip past since the FK only checks existence.
  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", parsed.data.project_id)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!project) return;

  const { error } = await supabase.from("punch_lists").insert({
    org_id: session.orgId,
    project_id: parsed.data.project_id,
    name: parsed.data.name,
    category: parsed.data.category?.trim() || null,
    created_by: session.userId,
  });
  if (error) throw new Error(`Could not create punch list: ${error.message}`);

  revalidatePath("/console/punch/lists");
  revalidatePath("/console/punch");
}

const ToggleSchema = z.object({
  id: z.string().uuid(),
  list_state: z.enum(["open", "closed"]),
});

export async function toggleListStatus(fd: FormData): Promise<void> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return;
  const parsed = ToggleSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("punch_lists")
    .update({ list_state: parsed.data.list_state, updated_at: new Date().toISOString() })
    .eq("id", parsed.data.id)
    .eq("org_id", session.orgId);
  if (error) throw new Error(`Could not update punch list: ${error.message}`);

  revalidatePath("/console/punch/lists");
  revalidatePath("/console/punch");
}

export async function deletePunchList(id: string): Promise<void> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return;
  if (!/^[0-9a-f-]{36}$/.test(id)) return;

  const supabase = await createClient();
  // FK on punch_items.punch_list_id is ON DELETE SET NULL so items
  // survive the list deletion — they just lose their grouping.
  const { error } = await supabase.from("punch_lists").delete().eq("id", id).eq("org_id", session.orgId);
  if (error) throw new Error(`Could not delete punch list: ${error.message}`);

  revalidatePath("/console/punch/lists");
  revalidatePath("/console/punch");
}
