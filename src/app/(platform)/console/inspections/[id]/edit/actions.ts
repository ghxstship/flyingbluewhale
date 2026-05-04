"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200),
  project_id: z.string().uuid().optional().or(z.literal("")),
  status: z.enum(["scheduled", "in_progress", "passed", "failed", "cancelled"]),
  scheduled_for: z.string().optional(),
  inspector_id: z.string().uuid().optional().or(z.literal("")),
  notes: z.string().max(2000).optional(),
});

export type State = { error?: string; ok?: true } | null;

export async function updateInspection(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const supabase = await createClient();
  const { id, ...patch } = parsed.data;
  const { error } = await supabase
    .from("inspections")
    .update({
      name: patch.name,
      project_id: patch.project_id || null,
      status: patch.status,
      scheduled_for: patch.scheduled_for || null,
      inspector_id: patch.inspector_id || null,
      notes: patch.notes || null,
      signed_at: patch.status === "passed" || patch.status === "failed" ? new Date().toISOString() : null,
      signed_by: patch.status === "passed" || patch.status === "failed" ? session.userId : null,
    } as never)
    .eq("id", id)
    .eq("org_id", session.orgId);
  if (error) return { error: error.message };
  revalidatePath(`/console/inspections/${id}`);
  revalidatePath("/console/inspections");
  redirect(`/console/inspections/${id}`);
}
