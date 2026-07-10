"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { createServiceClient, isServiceClientAvailable } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { hasSupabase } from "@/lib/env";
import { sendEmail, wrapEmailHtml } from "@/lib/email";
import { ratelimit, RATE_BUDGETS } from "@/lib/ratelimit";
import { BRAND } from "@/lib/brand";
import { log } from "@/lib/log";

export type ContactState = { ok?: true; error?: string } | null;

const ContactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  email: z.string().trim().email("Enter a valid email").max(320),
  company: z.string().trim().max(200).optional().or(z.literal("")),
  scale: z.string().trim().max(40).optional().or(z.literal("")),
  vertical: z.string().trim().max(120).optional().or(z.literal("")),
  message: z.string().trim().max(5000).optional().or(z.literal("")),
  demo: z.string().optional(),
  topic: z.string().trim().max(60).optional().or(z.literal("")),
  persona: z.string().trim().max(60).optional().or(z.literal("")),
  // Honeypot — bots fill every field; humans never see this one.
  website: z.string().max(0).optional().or(z.literal("")),
});

/**
 * The org the marketing-site lead rows land in. `leads.org_id` is NOT NULL,
 * so inbound demand from the public site is filed against the house org
 * (configurable via MARKETING_LEADS_ORG_SLUG; falls back to the GHXSTSHIP
 * house org, then the demo org).
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

/**
 * Marketing contact / walkthrough-request intake (E-01). Replaces the old
 * `action="mailto:sales@…"` form, which silently dropped every submission in
 * modern browsers. Writes a `leads` row against the house org AND emails
 * sales — either channel succeeding is enough to report success honestly.
 */
export async function submitContactAction(_: ContactState, fd: FormData): Promise<ContactState> {
  const parsed = ContactSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the fields and try again." };
  }
  const d = parsed.data;
  // Honeypot tripped — pretend success, store nothing.
  if (d.website) return { ok: true };

  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ?? hdrs.get("x-real-ip") ?? "unknown";
  const rate = await ratelimit({ key: `marketing-contact:${ip}`, ...RATE_BUDGETS.auth });
  if (!rate.ok) {
    return { error: "Too many submissions. Wait a minute and try again." };
  }

  const detailLines = [
    d.company && `Company: ${d.company}`,
    d.scale && `Team size: ${d.scale}`,
    d.vertical && `Vertical: ${d.vertical}`,
    d.topic && `Topic: ${d.topic}`,
    d.persona && `Persona: ${d.persona}`,
    d.demo ? "Requested a walkthrough: yes" : null,
    d.message && `Message:\n${d.message}`,
  ].filter(Boolean) as string[];

  let leadSaved = false;
  if (hasSupabase && isServiceClientAvailable()) {
    try {
      const svc = createServiceClient() as unknown as LooseSupabase;
      const orgId = await resolveHouseOrgId(svc);
      if (orgId) {
        const { error } = await svc.from("leads").insert({
          org_id: orgId,
          name: d.company ? `${d.name} (${d.company})` : d.name,
          email: d.email,
          source: d.topic === "walkthrough" ? "marketing_walkthrough" : "marketing_contact",
          notes: detailLines.join("\n") || null,
        });
        leadSaved = !error;
        if (error) log.warn("marketing_contact.lead_insert_failed", { err: error.message });
      }
    } catch (e) {
      log.warn("marketing_contact.lead_insert_failed", { err: e instanceof Error ? e.message : String(e) });
    }
  }

  let emailSent = false;
  try {
    const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const html = wrapEmailHtml(
      `<h2 style="margin:0 0 12px">New ${d.topic === "walkthrough" ? "walkthrough request" : "contact form submission"}</h2>
       <p style="margin:0 0 8px"><strong>${esc(d.name)}</strong> &lt;${esc(d.email)}&gt;</p>
       <pre style="white-space:pre-wrap;font-family:inherit;margin:0">${esc(detailLines.join("\n") || "(no details provided)")}</pre>`,
    );
    const res = await sendEmail({
      to: BRAND.emails.sales,
      replyTo: d.email,
      subject: `[atlvs.pro] ${d.topic === "walkthrough" ? "Walkthrough request" : "Contact"} · ${d.name}${d.company ? ` · ${d.company}` : ""}`,
      html,
      text: `${d.name} <${d.email}>\n${detailLines.join("\n")}`,
    });
    emailSent = res.ok;
  } catch (e) {
    log.warn("marketing_contact.email_failed", { err: e instanceof Error ? e.message : String(e) });
  }

  if (!leadSaved && !emailSent) {
    return {
      error: `We couldn't record your message just now. Email us directly at ${BRAND.emails.sales} and we'll pick it up.`,
    };
  }
  return { ok: true };
}
