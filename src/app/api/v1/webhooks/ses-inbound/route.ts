import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, apiOk } from "@/lib/api";
import { createServiceClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { log } from "@/lib/log";

/**
 * POST /api/v1/webhooks/ses-inbound
 *
 * AWS SES inbound-email webhook. Routes incoming messages to the
 * matching project_email row (by inbound_local_part) and inserts into
 * inbound_email_messages.
 *
 * The SES rule should be configured to POST the full SES JSON event
 * to this URL. Authentication is via the SES_INBOUND_SECRET shared
 * secret in the X-Webhook-Secret header — keeps a public POST endpoint
 * from being abused by random callers.
 *
 * Per the parity-doc disclaimer, this lands as a SCAFFOLD: the secret +
 * AWS-side rule-set setup is operational. The endpoint itself is fully
 * functional once SES is sending events to it.
 */

const SesEventSchema = z.object({
  notificationType: z.literal("Received").optional(),
  mail: z.object({
    messageId: z.string(),
    timestamp: z.string(),
    source: z.string(),
    destination: z.array(z.string()),
    commonHeaders: z
      .object({
        from: z.array(z.string()).optional(),
        to: z.array(z.string()).optional(),
        cc: z.array(z.string()).optional(),
        subject: z.string().optional(),
        date: z.string().optional(),
        messageId: z.string().optional(),
        replyTo: z.array(z.string()).optional(),
      })
      .optional(),
  }),
  receipt: z.object({}).optional(),
  content: z.string().optional(),
});

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const expected = process.env.SES_INBOUND_SECRET;
  if (!expected) {
    return apiError("internal", "SES_INBOUND_SECRET not configured; endpoint inactive.");
  }
  const got = req.headers.get("x-webhook-secret");
  // P0 hardening — constant-time compare on the webhook secret.
  // Length mismatch short-circuits without invoking timingSafeEqual
  // (which throws on different-length inputs). Without this a timing
  // oracle could probe the secret byte-by-byte.
  if (!got || got.length !== expected.length) {
    return apiError("forbidden", "Invalid webhook secret");
  }
  const { timingSafeEqual } = await import("node:crypto");
  if (!timingSafeEqual(Buffer.from(got), Buffer.from(expected))) {
    return apiError("forbidden", "Invalid webhook secret");
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("bad_request", "Invalid JSON body");
  }
  const parsed = SesEventSchema.safeParse(body);
  if (!parsed.success) return apiError("bad_request", parsed.error.issues[0]?.message ?? "Invalid SES event");

  const supabase = createServiceClient() as unknown as LooseSupabase;
  const evt = parsed.data;

  // Resolve project_email by destination local-part. Pick the first
  // destination that matches a project_email row in any org.
  const candidates: Array<{ local: string; raw: string }> = [];
  for (const dest of evt.mail.destination) {
    const match = dest.match(/^([^@]+)@/);
    if (match) candidates.push({ local: match[1], raw: dest });
  }

  let projectEmail: { id: string; org_id: string; project_id: string } | null = null;
  for (const c of candidates) {
    const { data: pe } = await supabase
      .from("project_emails")
      .select("id, org_id, project_id, is_active")
      .eq("inbound_local_part", c.local)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();
    type Pe = { id: string; org_id: string; project_id: string; is_active: boolean };
    const peRow = pe as Pe | null;
    if (peRow) {
      projectEmail = { id: peRow.id, org_id: peRow.org_id, project_id: peRow.project_id };
      break;
    }
  }

  if (!projectEmail) {
    log.warn("ses_inbound.no_match", { destinations: evt.mail.destination });
    // Acknowledge so SES doesn't retry; we don't want to crash on stray emails.
    return apiOk({ matched: false });
  }

  const headers = evt.mail.commonHeaders ?? {};
  const fromHeader = headers.from?.[0] ?? evt.mail.source;
  const fromMatch = fromHeader.match(/(?:"?([^"<]+)"?\s*)?<?([^@<>\s]+@[^@<>\s]+)>?/);
  const fromName = fromMatch?.[1]?.trim() || null;
  const fromEmail = fromMatch?.[2] ?? evt.mail.source;

  const { error } = await supabase.from("inbound_email_messages").insert({
    org_id: projectEmail.org_id,
    project_email_id: projectEmail.id,
    project_id: projectEmail.project_id,
    message_id: headers.messageId ?? evt.mail.messageId,
    in_reply_to: headers.replyTo?.[0] ?? null,
    thread_id: null,
    from_email: fromEmail,
    from_name: fromName,
    to_emails: headers.to ?? evt.mail.destination,
    cc_emails: headers.cc ?? [],
    subject: headers.subject ?? null,
    body_text: null,
    body_html: null,
    received_at: evt.mail.timestamp,
    raw_size_bytes: evt.content ? evt.content.length : null,
  });

  if (error) {
    log.error("ses_inbound.insert_failed", { err: error.message, messageId: evt.mail.messageId });
    return apiError("internal", error.message);
  }

  return apiOk({ matched: true, project_id: projectEmail.project_id });
}
