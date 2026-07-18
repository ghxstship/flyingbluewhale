"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession, isManagerPlus } from "@/lib/auth";
import { slugify } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { resolveActiveProject } from "../roster/shared";

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

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^\d{2}:\d{2}$/;

const PostJob = z.object({
  role: z.string().trim().min(1, "Name the role."),
  type: z.enum(["Shift", "Supervisor", "Contract"]).default("Shift"),
  openings: z.coerce.number().int().min(1).max(999).default(1),
  rate: z.string().optional(),
  date: z.string().regex(DATE, "Pick a date."),
  start: z.string().regex(TIME, "Set a start time."),
  end: z.string().regex(TIME).optional().or(z.literal("")),
  loc: z.string().trim().min(1, "Where is it?"),
  certs: z.string().optional(),
  gear: z.string().optional(),
  tags: z.string().optional(),
  desc: z.string().trim().min(1, "Describe the job."),
  roster: z.string().optional(),
  publish: z.enum(["Roster Only", "Org Network", "Job Board"]).default("Job Board"),
});

/** "OSHA-10, Forklift Cert" → ["OSHA-10", "Forklift Cert"]. */
function splitList(v: string | undefined): string[] {
  if (!v) return [];
  return v
    .split(/[·,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Kit publish segment → job_postings.publish_scope. */
const PUBLISH_SCOPE: Record<string, string> = {
  "Roster Only": "roster_only",
  "Org Network": "org_network",
  "Job Board": "job_board",
};

/**
 * Post a job — the kit's Post Job FAB (CREATE map: `jobs`, perm `approve` →
 * the manager band).
 *
 * Kit 31 (live-test resolution #18): full assignment-flow field parity +
 * the publish-scope segment. Job Board and Org Network publish immediately
 * ('published'; the public feed additionally requires scope job_board —
 * see the public_job_board view). Roster Only stays 'draft': it never
 * reaches the org's job list, only the project roster's Open Roles, where
 * one tap publishes it to the board. The add-to-roster switch pins the
 * posting to the ACTIVE project so Open Roles picks it up.
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

  // Add-to-roster pins the posting to the active project (same resolution
  // the roster surface uses), so its Open Roles list carries the opening.
  let projectId: string | null = null;
  if (v.roster) {
    const project = await resolveActiveProject(session.orgId);
    projectId = project?.id ?? null;
  }

  const scope = PUBLISH_SCOPE[v.publish] ?? "job_board";
  const publishesNow = scope !== "roster_only";
  const shiftStart = new Date(`${v.date}T${v.start}:00`);
  const shiftEnd = v.end ? new Date(`${v.date}T${v.end}:00`) : null;
  // An overnight shift ends tomorrow, not before it starts.
  if (shiftEnd && shiftEnd <= shiftStart) shiftEnd.setDate(shiftEnd.getDate() + 1);

  // Same slug convention as the console intake: slugified title + a 5-char
  // suffix so two "Stagehand" posts don't collide.
  const publicSlug = `${slugify(v.role)}-${Math.random().toString(36).slice(2, 7)}`;
  const { error } = await supabase.from("job_postings").insert({
    org_id: session.orgId,
    title: v.role,
    public_slug: publicSlug,
    description: v.desc,
    employment_type: v.type.toLowerCase(),
    openings: v.openings,
    project_id: projectId,
    city: v.loc || null,
    certs_required: splitList(v.certs),
    gear_required: splitList(v.gear),
    role_taxonomy: splitList(v.tags),
    day_rate_min_cents: Number.isFinite(rateNum) && rateNum > 0 ? Math.round(rateNum * 100) : null,
    shift_starts_at: shiftStart.toISOString(),
    shift_ends_at: shiftEnd ? shiftEnd.toISOString() : null,
    expires_at: new Date(`${v.date}T23:59:59`).toISOString(),
    publish_scope: scope,
    job_posting_phase: publishesNow ? "published" : "draft",
    published_at: publishesNow ? new Date().toISOString() : null,
    created_by: session.userId,
  });
  if (error) return { error: error.message };

  revalidatePath("/m/jobs");
  revalidatePath("/m/roster");
  return null;
}

/**
 * Kit 31 #18 — one-tap Publish from the roster's Open Roles: a Roster Only
 * opening goes to the public Job Board (scope job_board + published).
 */
export async function publishOpenRole(_prev: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "You need manager access to publish jobs." };
  const jobId = String(fd.get("jobId") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(jobId)) return { error: "Invalid job." };

  const supabase = await createClient();
  const { data: job } = await supabase
    .from("job_postings")
    .select("id, publish_scope")
    .eq("id", jobId)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!job) return { error: "Job not found." };

  const { error } = await supabase
    .from("job_postings")
    .update({
      publish_scope: "job_board",
      job_posting_phase: "published",
      published_at: new Date().toISOString(),
    })
    .eq("id", jobId)
    .eq("org_id", session.orgId);
  if (error) return { error: error.message };

  revalidatePath("/m/roster");
  revalidatePath("/m/jobs");
  return { ok: "published" };
}
