"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { updateOrgScopedWithCheck, STALE_ROW_MESSAGE } from "@/lib/db/concurrency";
import { formFail } from "@/lib/forms/fail";

const Schema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().max(4000).optional(),
  project_id: z.string().uuid(),
  priority: z.enum(["low", "normal", "high", "urgent"]),
  status: z.enum(["open", "in_progress", "ready_for_review", "complete", "void"]),
  assignee_id: z.string().uuid().optional().or(z.literal("")),
  vendor_id: z.string().uuid().optional().or(z.literal("")),
  due_at: z.string().optional(),
  site_plan_id: z.string().uuid().optional().or(z.literal("")),
  show_ready_gate: z.string().optional(),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function updatePunchItem(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const { id, ...patch } = parsed.data;

  // Cross-tenant FK guards on project_id, vendor_id, site_plan_id.
  const supabase = await createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", patch.project_id)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!project) return { error: "Project not found in your organization" };
  if (patch.vendor_id) {
    const { data: vendor } = await supabase
      .from("vendors")
      .select("id")
      .eq("id", patch.vendor_id)
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .maybeSingle();
    if (!vendor) return { error: "Vendor not found in your organization" };
  }
  if (patch.site_plan_id) {
    const { data: sitePlan } = await supabase
      .from("site_plans")
      .select("id")
      .eq("id", patch.site_plan_id)
      .eq("org_id", session.orgId)
      .maybeSingle();
    if (!sitePlan) return { error: "Site plan not found in your organization" };
  }

  // Sea Trial FINDING-022: optimistic concurrency.
  const expectedUpdatedAt = String(fd.get("_updated_at") ?? "");
  const result = await updateOrgScopedWithCheck("punch_items", session.orgId, id, expectedUpdatedAt, {
    title: patch.title,
    description: patch.description || null,
    project_id: patch.project_id,
    priority: patch.priority,
    status: patch.status,
    assignee_id: patch.assignee_id || null,
    vendor_id: patch.vendor_id || null,
    due_at: patch.due_at || null,
    site_plan_id: patch.site_plan_id || null,
    show_ready_gate: patch.show_ready_gate === "1",
    closed_at: patch.status === "complete" ? new Date().toISOString() : null,
    closed_by: patch.status === "complete" ? session.userId : null,
  } as never);
  if (!result.ok) {
    return { error: result.reason === "stale" ? STALE_ROW_MESSAGE : "Punch Item not found." };
  }
  revalidatePath(`/console/punch/${id}`);
  revalidatePath("/console/punch");
  redirect(`/console/punch/${id}`);
}
