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
  project_id: z.string().uuid(),
  spec_section: z.string().max(80).optional(),
  vendor_id: z.string().uuid().optional().or(z.literal("")),
  ball_in_court_id: z.string().uuid().optional().or(z.literal("")),
  status: z.enum([
    "draft",
    "submitted",
    "in_review",
    "approved",
    "approved_with_comments",
    "revise_resubmit",
    "rejected",
    "void",
    "closed",
  ]),
  due_at: z.string().optional(),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function updateSubmittal(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const { id, ...patch } = parsed.data;

  // Cross-tenant FK guards on project_id + vendor_id when reassigning.
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

  // Sea Trial FINDING-022: optimistic concurrency.
  const expectedUpdatedAt = String(fd.get("_updated_at") ?? "");
  const result = await updateOrgScopedWithCheck("submittals", session.orgId, id, expectedUpdatedAt, {
    title: patch.title,
    project_id: patch.project_id,
    spec_section: patch.spec_section || null,
    vendor_id: patch.vendor_id || null,
    ball_in_court_id: patch.ball_in_court_id || null,
    status: patch.status,
    due_at: patch.due_at || null,
  } as never);
  if (!result.ok) {
    return { error: result.reason === "stale" ? STALE_ROW_MESSAGE : "Submittal not found." };
  }
  revalidatePath(`/console/submittals/${id}`);
  revalidatePath("/console/submittals");
  redirect(`/console/submittals/${id}`);
}
