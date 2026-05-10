"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { updateOrgScopedWithCheck, STALE_ROW_MESSAGE } from "@/lib/db/concurrency";

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
  const { id, ...patch } = parsed.data;

  // Cross-tenant FK guard on project_id when reassigning the inspection.
  if (patch.project_id) {
    const supabase = await createClient();
    const { data: project } = await supabase
      .from("projects")
      .select("id")
      .eq("id", patch.project_id)
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .maybeSingle();
    if (!project) return { error: "Project not found in your organization" };
  }

  // Sea Trial FINDING-022: optimistic concurrency.
  const expectedUpdatedAt = String(fd.get("_updated_at") ?? "");
  const result = await updateOrgScopedWithCheck("inspections", session.orgId, id, expectedUpdatedAt, {
    name: patch.name,
    project_id: patch.project_id || null,
    status: patch.status,
    scheduled_for: patch.scheduled_for || null,
    inspector_id: patch.inspector_id || null,
    notes: patch.notes || null,
    signed_at: patch.status === "passed" || patch.status === "failed" ? new Date().toISOString() : null,
    signed_by: patch.status === "passed" || patch.status === "failed" ? session.userId : null,
  } as never);
  if (!result.ok) {
    return { error: result.reason === "stale" ? STALE_ROW_MESSAGE : "Inspection not found." };
  }
  revalidatePath(`/console/inspections/${id}`);
  revalidatePath("/console/inspections");
  redirect(`/console/inspections/${id}`);
}
