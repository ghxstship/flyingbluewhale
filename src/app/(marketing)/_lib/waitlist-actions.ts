"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { createServiceClient, isServiceClientAvailable } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { hasSupabase } from "@/lib/env";
import { ratelimit, RATE_BUDGETS } from "@/lib/ratelimit";
import { BRAND } from "@/lib/brand";
import { log } from "@/lib/log";

/**
 * Coming-soon waitlist intake for the ATLVS and GVTEWAY teaser pages.
 * Deliberately mirrors the marketing contact intake (`contact/actions.ts`):
 * same house-org resolution, same `leads` column shape (org_id / name /
 * email / source / notes), same log-warn fallback. The only difference is
 * the `source` value, which tags which product the signup is for.
 */

export type WaitlistProduct = "atlvs" | "gvteway";

export type WaitlistState = { ok?: true; error?: string } | null;

const WaitlistSchema = z.object({
  email: z.string().trim().email("Enter a valid email").max(320),
  name: z.string().trim().max(200).optional().or(z.literal("")),
  company: z.string().trim().max(200).optional().or(z.literal("")),
  // Honeypot — bots fill every field; humans never see this one.
  website: z.string().max(0).optional().or(z.literal("")),
});

/**
 * Same house-org resolution as the contact intake: `leads.org_id` is
 * NOT NULL, so public-site signups file against the house org
 * (MARKETING_LEADS_ORG_SLUG, then the GHXSTSHIP house org, then demo).
 */
async function resolveHouseOrgId(svc: LooseSupabase): Promise<string | null> {
  const candidates = [process.env.MARKETING_LEADS_ORG_SLUG, "ghxstship", "demo"].filter(
    (s): s is string => Boolean(s),
  );
  for (const slug of candidates) {
    const { data } = await svc.from("orgs").select("id").eq("slug", slug).maybeSingle();
    if (data?.id) return data.id as string;
  }
  return null;
}

export async function joinWaitlist(
  product: WaitlistProduct,
  _prev: WaitlistState,
  fd: FormData,
): Promise<WaitlistState> {
  // The product arg arrives via .bind() from the client form; never trust it
  // as-is on a server boundary.
  if (product !== "atlvs" && product !== "gvteway") {
    return { error: "Unknown product." };
  }
  const parsed = WaitlistSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the fields and try again." };
  }
  const d = parsed.data;
  // Honeypot tripped — pretend success, store nothing.
  if (d.website) return { ok: true };

  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ?? hdrs.get("x-real-ip") ?? "unknown";
  const rate = await ratelimit({ key: `marketing-waitlist:${product}:${ip}`, ...RATE_BUDGETS.auth });
  if (!rate.ok) {
    return { error: "Too many submissions. Wait a minute and try again." };
  }

  const productName = product === "atlvs" ? "ATLVS" : "GVTEWAY";
  const detailLines = [
    `Waitlist: ${productName}`,
    d.company && `Company: ${d.company}`,
  ].filter(Boolean) as string[];

  let leadSaved = false;
  if (hasSupabase && isServiceClientAvailable()) {
    try {
      const svc = createServiceClient() as unknown as LooseSupabase;
      const orgId = await resolveHouseOrgId(svc);
      if (orgId) {
        // `leads.name` is NOT NULL; when no name is given, the email itself
        // is the honest identifier (nothing invented).
        const baseName = d.name || d.email;
        const { error } = await svc.from("leads").insert({
          org_id: orgId,
          name: d.company ? `${baseName} (${d.company})` : baseName,
          email: d.email,
          source: `${product}-waitlist`,
          notes: detailLines.join("\n") || null,
        });
        leadSaved = !error;
        if (error) log.warn("marketing_waitlist.lead_insert_failed", { product, err: error.message });
      }
    } catch (e) {
      log.warn("marketing_waitlist.lead_insert_failed", {
        product,
        err: e instanceof Error ? e.message : String(e),
      });
    }
  }

  if (!leadSaved) {
    return {
      error: `We couldn't save that just now. Email us at ${BRAND.emails.sales} and we'll add you by hand.`,
    };
  }
  return { ok: true };
}
