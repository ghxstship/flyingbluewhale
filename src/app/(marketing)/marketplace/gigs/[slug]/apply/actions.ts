"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { actionFail, formFail } from "@/lib/forms/fail";
import type { FormState } from "@/components/FormShell";

const Schema = z.object({
  cover_note: z.string().min(10, "Tell the operator why you're a fit — at least 10 characters").max(4000),
  portfolio_url: z.string().url("Portfolio must be a valid URL").max(400).optional().or(z.literal("")),
  phone: z.string().max(40).optional().or(z.literal("")),
});

export async function applyToGig(slug: string, _prev: FormState, fd: FormData): Promise<FormState> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);

  const supabase = await createClient();

  // Resolve the posting under the public-select RLS policy (published only).
  // The public_job_board view omits org_id, so we read the base table here.
  const { data: posting, error: postingError } = await supabase
    .from("job_postings")
    .select("id, org_id, expires_at")
    .eq("public_slug", slug)
    .eq("status", "published")
    .is("deleted_at", null)
    .maybeSingle();
  if (postingError) return actionFail(postingError.message, fd);
  if (!posting || (posting.expires_at && new Date(posting.expires_at) <= new Date())) {
    return actionFail("This gig is no longer accepting applications.", fd);
  }

  // Duplicate guard — one live application per user per posting.
  const { data: existing, error: existingError } = await supabase
    .from("job_applications")
    .select("id")
    .eq("job_posting_id", posting.id)
    .eq("applicant_user_id", session.userId)
    .neq("status", "withdrawn")
    .maybeSingle();
  if (existingError) return actionFail(existingError.message, fd);
  if (existing) {
    return actionFail("You've already applied to this gig. Track it under My Applications.", fd);
  }

  const { error } = await supabase.from("job_applications").insert({
    org_id: posting.org_id,
    job_posting_id: posting.id,
    applicant_user_id: session.userId,
    cover_note: parsed.data.cover_note,
    reel_url: parsed.data.portfolio_url || null,
    answers: parsed.data.phone ? { phone: parsed.data.phone } : {},
  });
  if (error) {
    if (error.code === "23505") {
      return actionFail("You've already applied to this gig. Track it under My Applications.", fd);
    }
    return actionFail(error.message, fd);
  }

  redirect("/me/applications?applied=1");
}
