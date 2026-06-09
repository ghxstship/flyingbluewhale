"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createServiceClient, isServiceClientAvailable } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { actionFail, formFail } from "@/lib/forms/fail";

const Schema = z.object({
  name: z.string().min(2).max(120),
  slug: z
    .string()
    .min(2)
    .max(48)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and dashes only"),
  partner_org_name: z.string().min(2).max(120),
  partner_contact_email: z.string().email().max(200),
  partner_contact_name: z.string().max(120).optional().or(z.literal("")),
  category: z.enum([
    "payments",
    "ai",
    "infra",
    "comms",
    "auth",
    "observability",
    "geo",
    "calendar",
    "accounting",
    "field",
    "design",
    "other",
  ]),
  short_description: z.string().min(10).max(200),
  long_description: z.string().max(2000).optional().or(z.literal("")),
  capabilities: z.string().max(2000).optional().or(z.literal("")),
  homepage_url: z.string().url().max(400).optional().or(z.literal("")),
  docs_url: z.string().url().max(400).optional().or(z.literal("")),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function submitPartnerIntegration(_: State, fd: FormData): Promise<State> {
  const raw = Object.fromEntries(fd);
  const parsed = Schema.safeParse(raw);
  if (!parsed.success) return formFail(parsed.error, fd);

  const capabilities = (parsed.data.capabilities ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 30);

  // Service-role client — public can submit, so we bypass RLS once we've
  // validated and we don't have an authed session yet.
  if (!isServiceClientAvailable()) {
    return { error: "Submissions are temporarily unavailable. Please try again later." };
  }
  const supabase = createServiceClient() as unknown as LooseSupabase;

  // Slug-uniqueness pre-check to give a friendly error before we hit the
  // unique-index violation.
  const { data: existing } = await supabase
    .from("partner_integrations")
    .select("id")
    .eq("slug", parsed.data.slug)
    .is("deleted_at", null)
    .maybeSingle();
  if (existing) return { error: "A submission with that slug already exists. Pick a new slug." };

  const { error } = await supabase.from("partner_integrations").insert({
    slug: parsed.data.slug,
    name: parsed.data.name,
    partner_org_name: parsed.data.partner_org_name,
    partner_contact_email: parsed.data.partner_contact_email,
    partner_contact_name: parsed.data.partner_contact_name || null,
    short_description: parsed.data.short_description,
    long_description: parsed.data.long_description || null,
    category: parsed.data.category,
    capabilities,
    homepage_url: parsed.data.homepage_url || null,
    docs_url: parsed.data.docs_url || null,
    certification_tier: "submitted",
  });
  if (error) return actionFail(error.message, fd);

  revalidatePath("/console/settings/integrations/submissions");
  redirect("/integrations/submit/thanks");
}
