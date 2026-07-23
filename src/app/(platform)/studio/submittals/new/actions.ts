"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { nextOrgCode } from "@/lib/codes";
import { actionFail, formFail } from "@/lib/forms/fail";
import { actionErrorMessage } from "@/lib/errors";

const Schema = z.object({
  title: z.string().min(1).max(200),
  project_id: z.string().uuid(),
  spec_section: z.string().max(80).optional(),
  vendor_id: z.string().uuid().optional().or(z.literal("")),
  ball_in_court_id: z.string().uuid().optional().or(z.literal("")),
  due_at: z.string().optional(),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function createSubmittal(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const supabase = await createClient();

  // Cross-tenant FK guards on project_id and optional vendor_id.
  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", parsed.data.project_id)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!project) return { error: actionErrorMessage("not-found.project-in-org", "Project not found in your organization") };

  if (parsed.data.vendor_id) {
    const { data: vendor } = await supabase
      .from("vendors")
      .select("id")
      .eq("id", parsed.data.vendor_id)
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .maybeSingle();
    if (!vendor) return { error: actionErrorMessage("not-found.vendor-in-org", "Vendor not found in your organization") };
  }

  const code = await nextOrgCode("submittals", session.orgId, "SUB");

  const { data: sub, error } = await supabase
    .from("submittals")
    .insert({
      org_id: session.orgId,
      code,
      title: parsed.data.title,
      project_id: parsed.data.project_id,
      spec_section: parsed.data.spec_section || null,
      vendor_id: parsed.data.vendor_id || null,
      ball_in_court_id: parsed.data.ball_in_court_id || null,
      due_at: parsed.data.due_at || null,
      created_by: session.userId,
    } as never)
    .select("id")
    .single();
  if (error) return actionFail(error.message, fd);

  // Always seed round 1 so the revision register is ready for stamping.
  const { error: insertError } = await supabase.from("submittal_revisions").insert({
    org_id: session.orgId,
    submittal_id: sub.id,
    round: 1,
    submitted_by: session.userId,
  } as never);
  if (insertError) return actionFail(insertError.message, fd);

  revalidatePath("/studio/submittals");
  redirect(`/studio/submittals/${sub.id}`);
}
