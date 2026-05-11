"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { JOB_POSTING_TYPES, slugify } from "@/lib/marketplace";

const Schema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(8000).optional().or(z.literal("")),
  posting_type: z.enum(JOB_POSTING_TYPES).default("single"),
  employment_type: z.enum(["w2", "1099", "volunteer", "contract"]).default("1099"),
  region: z.string().max(80).optional().or(z.literal("")),
  city: z.string().max(80).optional().or(z.literal("")),
  country: z.string().max(80).optional().or(z.literal("")),
  role_taxonomy: z.string().max(400).optional().or(z.literal("")),
  certs_required: z.string().max(400).optional().or(z.literal("")),
  union_required: z.string().max(400).optional().or(z.literal("")),
  day_rate_min: z.string().optional().or(z.literal("")),
  day_rate_max: z.string().optional().or(z.literal("")),
  currency: z
    .string()
    .regex(/^[A-Z]{3}$/)
    .default("USD"),
  vetted_only: z.string().optional(),
  travel_paid: z.string().optional(),
  lodging_provided: z.string().optional(),
});

export type State = { error?: string } | null;

const toCents = (v: string | undefined): number | null => {
  if (!v) return null;
  const n = Number(v.replace(/[$,]/g, ""));
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) : null;
};

const toArray = (v: string | undefined): string[] =>
  (v ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

export async function createPostingAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  // Job postings reach the public marketplace surface — manager+ only.
  if (!isManagerPlus(session)) return { error: "Only manager+ can create job postings" };
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const supabase = await createClient();

  // Generate a unique-ish slug. Conflicts get a 5-char suffix.
  const baseSlug = slugify(parsed.data.title);
  const slugSuffix = Math.random().toString(36).slice(2, 7);
  const publicSlug = `${baseSlug}-${slugSuffix}`;

  const { data, error } = await supabase
    .from("job_postings")
    .insert({
      org_id: session.orgId,
      title: parsed.data.title,
      public_slug: publicSlug,
      description: parsed.data.description || null,
      posting_type: parsed.data.posting_type,
      employment_type: parsed.data.employment_type,
      region: parsed.data.region || null,
      city: parsed.data.city || null,
      country: parsed.data.country || null,
      role_taxonomy: toArray(parsed.data.role_taxonomy),
      certs_required: toArray(parsed.data.certs_required),
      union_required: toArray(parsed.data.union_required),
      day_rate_min_cents: toCents(parsed.data.day_rate_min),
      day_rate_max_cents: toCents(parsed.data.day_rate_max),
      currency: parsed.data.currency,
      vetted_only: parsed.data.vetted_only === "on",
      travel_paid: parsed.data.travel_paid === "on",
      lodging_provided: parsed.data.lodging_provided === "on",
      job_posting_phase: "draft",
      created_by: session.userId,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/console/marketplace/postings");
  redirect(`/console/marketplace/postings/${(data as { id: string }).id}`);
}

const PublishSchema = z.object({
  posting_id: z.string().uuid(),
  expires_at: z.string().optional().or(z.literal("")),
});

// Job-posting FSM: draft → published → closed. Guards use
// .eq("job_posting_phase", <expected>) so stale UI / direct API calls
// can't skip states. .select("id") confirms the conditional update matched.

export async function publishPostingAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Only manager+ can publish job postings" };
  const parsed = PublishSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("job_postings")
    .update({
      job_posting_phase: "published",
      published_at: new Date().toISOString(),
      expires_at: parsed.data.expires_at || null,
    })
    .eq("id", parsed.data.posting_id)
    .eq("org_id", session.orgId)
    .eq("job_posting_phase", "draft")
    .select("id");

  if (error) return { error: error.message };
  if (!data || data.length === 0) return { error: "Only a draft posting can be published" };
  revalidatePath("/console/marketplace/postings");
  revalidatePath(`/console/marketplace/postings/${parsed.data.posting_id}`);
  return { error: undefined };
}

export async function closePostingAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Only manager+ can close job postings" };
  const id = String(fd.get("posting_id") ?? "");
  if (!id) return { error: "Missing posting" };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("job_postings")
    .update({ job_posting_phase: "closed" })
    .eq("id", id)
    .eq("org_id", session.orgId)
    .eq("job_posting_phase", "published")
    .select("id");
  if (error) return { error: error.message };
  if (!data || data.length === 0) return { error: "Only a published posting can be closed" };
  revalidatePath("/console/marketplace/postings");
  revalidatePath(`/console/marketplace/postings/${id}`);
  return { error: undefined };
}
