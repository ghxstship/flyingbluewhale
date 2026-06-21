"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * /m/gigs write actions. applyToJob inserts a job_application for the caller
 * against a published job_posting in their org. Idempotent — re-applying is a
 * no-op. RLS re-checked server-side.
 */

export type State = { error?: string; ok?: string } | null;

const ApplySchema = z.object({
  jobId: z.string().uuid(),
  coverNote: z.string().max(2000).optional(),
});

export async function applyToJob(_prev: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = ApplySchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const { jobId, coverNote } = parsed.data;
  const supabase = await createClient();

  // Org pin — the posting must belong to the caller's org.
  const { data: job } = await supabase
    .from("job_postings")
    .select("id, org_id")
    .eq("id", jobId)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!job) return { error: "Job not found." };

  // Dedupe — one application per user per posting.
  const { data: existing } = await supabase
    .from("job_applications")
    .select("id")
    .eq("job_posting_id", jobId)
    .eq("applicant_user_id", session.userId)
    .maybeSingle();
  if (existing) return { ok: "applied" };

  const { error } = await supabase.from("job_applications").insert({
    org_id: session.orgId,
    job_posting_id: jobId,
    applicant_user_id: session.userId,
    cover_note: coverNote || null,
    job_application_state: "new",
  });
  if (error) return { error: error.message };

  revalidatePath("/m/gigs");
  return { ok: "applied" };
}
