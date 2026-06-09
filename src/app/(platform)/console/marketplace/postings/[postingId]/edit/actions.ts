"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { JOB_POSTING_TYPES } from "@/lib/marketplace";
import { actionFail, formFail } from "@/lib/forms/fail";

const Schema = z.object({
  posting_id: z.string().uuid(),
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

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

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

export async function updatePostingAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Only manager+ can edit job postings" };
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const supabase = await createClient();
  const { error } = await supabase
    .from("job_postings")
    .update({
      title: parsed.data.title,
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
    })
    .eq("id", parsed.data.posting_id)
    .eq("org_id", session.orgId);
  if (error) return actionFail(error.message, fd);
  revalidatePath(`/console/marketplace/postings/${parsed.data.posting_id}`);
  redirect(`/console/marketplace/postings/${parsed.data.posting_id}`);
}
