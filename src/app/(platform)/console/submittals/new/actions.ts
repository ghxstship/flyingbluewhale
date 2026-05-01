"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { nextOrgCode } from "@/lib/codes";

const Schema = z.object({
  title: z.string().min(1).max(200),
  project_id: z.string().uuid(),
  spec_section: z.string().max(80).optional(),
  vendor_id: z.string().uuid().optional().or(z.literal("")),
  ball_in_court_id: z.string().uuid().optional().or(z.literal("")),
  due_at: z.string().optional(),
});

export type State = { error?: string } | null;

export async function createSubmittal(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const supabase = await createClient();
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
  if (error) return { error: error.message };

  // Always seed round 1 so the revision register is ready for stamping.
  await supabase.from("submittal_revisions").insert({
    org_id: session.orgId,
    submittal_id: sub.id,
    round: 1,
    submitted_by: session.userId,
  } as never);

  revalidatePath("/console/submittals");
  redirect(`/console/submittals/${sub.id}`);
}
