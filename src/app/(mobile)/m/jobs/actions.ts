"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession, isManagerPlus } from "@/lib/auth";
import { slugify } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

/**
 * /m/jobs write actions. applyToJob inserts a job_application for the caller
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

  revalidatePath("/m/jobs");
  return { ok: "applied" };
}

const PostJob = z.object({
  role: z.string().trim().min(1, "Name the role."),
  rate: z.string().optional(),
  when: z.string().optional(),
  loc: z.string().optional(),
  desc: z.string().trim().min(1, "Describe the job."),
});

/**
 * Post a job — the kit's Post Job FAB (CREATE map: `jobs`, perm `approve` →
 * the manager band). Publishes immediately: a field posting is a "we need
 * hands NOW" act, and a draft nobody sees defeats it.
 *
 * The kit's Rate field is free text with an "$/hr" placeholder while the
 * store is day-rate cents — a unit collision the kit needs to settle. Until
 * it does: a parseable number is stored as `day_rate_min_cents` (the trade's
 * dominant quoting unit is the day), an unparseable one is dropped rather
 * than smuggled into prose.
 */
export async function postJob(_prev: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "You need manager access to post jobs." };
  const parsed = PostJob.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Fill in the role and description." };
  const v = parsed.data;

  const rateNum = v.rate ? Number(v.rate.replace(/[^0-9.]/g, "")) : NaN;
  const supabase = await createClient();
  // Same slug convention as the console intake: slugified title + a 5-char
  // suffix so two "Stagehand" posts don't collide.
  const publicSlug = `${slugify(v.role)}-${Math.random().toString(36).slice(2, 7)}`;
  const { error } = await supabase.from("job_postings").insert({
    org_id: session.orgId,
    title: v.role,
    public_slug: publicSlug,
    description: v.desc,
    employment_type: "contract",
    city: v.loc || null,
    day_rate_min_cents: Number.isFinite(rateNum) && rateNum > 0 ? Math.round(rateNum * 100) : null,
    expires_at: v.when ? new Date(`${v.when}T23:59:59`).toISOString() : null,
    job_posting_phase: "published",
    published_at: new Date().toISOString(),
    created_by: session.userId,
  });
  if (error) return { error: error.message };

  revalidatePath("/m/jobs");
  return null;
}
