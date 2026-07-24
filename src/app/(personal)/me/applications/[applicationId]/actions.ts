"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { writeInbox } from "@/lib/inbox";

/**
 * Applicant-initiated withdrawal — the surface the reviewer-side action
 * files always referenced but which never existed (comms audit follow-up):
 * `/me/applications` was read-only, so `withdrawn` was unreachable and the
 * org was never told an applicant pulled out.
 *
 * RLS: `job_applications_update` grants the applicant self-update, so this
 * rides the caller's own client. Reverse notice goes to the posting's
 * creator (the closest accountable human; org-wide would be noise).
 */

const WITHDRAWABLE = new Set(["new", "reviewed", "phone", "hold"]);

const Schema = z.object({ application_id: z.string().uuid() });

export type State = { error?: string; ok?: true } | null;

export async function withdrawApplicationAction(_prev: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Invalid request" };
  const supabase = await createClient();

  const { data: row } = await supabase
    .from("job_applications")
    .select("id, org_id, job_application_state, applicant_user_id, job_posting_id")
    .eq("id", parsed.data.application_id)
    .eq("applicant_user_id", session.userId)
    .maybeSingle();
  if (!row) return { error: "Application not found" };
  const app = row as {
    id: string;
    org_id: string;
    job_application_state: string;
    job_posting_id: string;
  };
  if (!WITHDRAWABLE.has(app.job_application_state)) {
    return { error: "This application can no longer be withdrawn" };
  }

  const { data: updated, error } = await supabase
    .from("job_applications")
    .update({ job_application_state: "withdrawn" })
    .eq("id", app.id)
    .eq("applicant_user_id", session.userId)
    .eq("job_application_state", app.job_application_state as "new")
    .select("id");
  if (error) return { error: error.message };
  if (!updated || updated.length === 0) return { error: "Application was updated concurrently. Refresh and retry" };

  // Reverse notice — tell the posting's creator. Best-effort.
  const { data: posting } = await supabase
    .from("job_postings")
    .select("id, title, created_by")
    .eq("id", app.job_posting_id)
    .maybeSingle();
  const creator = (posting as { title: string; created_by: string | null } | null) ?? null;
  if (creator?.created_by && creator.created_by !== session.userId) {
    void writeInbox({
      userId: creator.created_by,
      orgId: app.org_id,
      kind: "marketplace",
      sourceType: "job_applications",
      sourceId: app.id,
      actorId: session.userId,
      title: `Application Withdrawn: ${creator.title}`,
      body: "An applicant withdrew their application.",
      href: `/studio/marketplace/postings/${app.job_posting_id}/applicants`,
      reNotify: true,
    });
  }

  revalidatePath("/me/applications");
  revalidatePath(`/me/applications/${app.id}`);
  return { ok: true };
}
