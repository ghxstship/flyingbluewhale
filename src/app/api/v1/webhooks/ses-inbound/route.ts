import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, apiOk, parseJson } from "@/lib/api";
import { createServiceClient, isServiceClientAvailable } from "@/lib/supabase/server";
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

  const parsed = await parseJson(req, SesEventSchema);
  if (parsed instanceof NextResponse) return parsed;

  if (!isServiceClientAvailable()) {
    return apiError(
      "service_unavailable",
      "This endpoint requires SUPABASE_SERVICE_ROLE_KEY in the runtime environment.",
    );
  }
  const supabase = createServiceClient() as unknown as LooseSupabase;
  const evt = parsed;

  // Resolve project_email by destination local-part. Pick the first
  // destination that matches a project_email row in any org.
  const candidates: Array<{ local: string; raw: string }> = [];
  for (const dest of evt.mail.destination) {
    const match = dest.match(/^([^@]+)@/);
    if (match) candidates.push({ local: match[1]!, raw: dest });
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

  // Kit 27 — email-ingest fallback: a reply to the advance thread from a
  // known packet recipient is mirrored into their submission record,
  // flagged `received_via='email_ingest'`, so attachments never escape
  // into an inbox (the LPS failure mode). The row lands on the
  // recipient's first schema-bearing section as a manifest line; the
  // operator reviews it on the tracking board.
  try {
    await mirrorAdvanceReply(supabase, {
      orgId: projectEmail.org_id,
      fromEmail,
      subject: headers.subject ?? null,
      messageId: headers.messageId ?? evt.mail.messageId,
      receivedAt: evt.mail.timestamp,
    });
  } catch (err) {
    log.warn("ses_inbound.advance_mirror_failed", {
      err: err instanceof Error ? err.message : String(err),
    });
  }

  return apiOk({ matched: true, project_id: projectEmail.project_id });
}

async function mirrorAdvanceReply(
  supabase: LooseSupabase,
  input: { orgId: string; fromEmail: string; subject: string | null; messageId: string; receivedAt: string },
): Promise<void> {
  const email = input.fromEmail.toLowerCase();
  const { data: recipients } = (await supabase
    .from("advance_send_recipients")
    .select("id, org_id, contact, audience_id")
    .eq("org_id", input.orgId)
    .is("deleted_at", null)
    .contains("contact", { email })
    .limit(1)) as {
    data: Array<{ id: string; org_id: string; audience_id: string | null }> | null;
  };
  const recipient = recipients?.[0];
  if (!recipient) return;

  // Land on the recipient's first schema-bearing assigned section (their
  // structured-return home); fall back to any schema-bearing section of
  // the packet when the audience has no explicit assignments.
  let sectionId: string | null = null;
  if (recipient.audience_id) {
    const { data: assigned } = (await supabase
      .from("advance_section_assignments")
      .select("section_id, advance_packet_sections!inner(submission_schema_key)")
      .eq("audience_id", recipient.audience_id)
      .not("advance_packet_sections.submission_schema_key", "is", null)
      .is("deleted_at", null)
      .limit(1)) as { data: Array<{ section_id: string }> | null };
    sectionId = assigned?.[0]?.section_id ?? null;
  }
  if (!sectionId) return;

  const manifestRow = {
    source: "email",
    message_id: input.messageId,
    subject: input.subject,
    received_at: input.receivedAt,
  };
  const { data: existing } = (await supabase
    .from("advance_submissions")
    .select("id, rows, submission_state")
    .eq("recipient_id", recipient.id)
    .eq("section_id", sectionId)
    .is("deleted_at", null)
    .maybeSingle()) as {
    data: { id: string; rows: Array<Record<string, unknown>>; submission_state: string } | null;
  };
  if (existing) {
    if (existing.submission_state === "accepted") return;
    await supabase
      .from("advance_submissions")
      .update({ rows: [...(existing.rows ?? []), manifestRow] })
      .eq("id", existing.id);
  } else {
    const { data: section } = (await supabase
      .from("advance_packet_sections")
      .select("submission_schema_key")
      .eq("id", sectionId)
      .is("deleted_at", null)
      .maybeSingle()) as { data: { submission_schema_key: string | null } | null };
    await supabase.from("advance_submissions").insert({
      org_id: recipient.org_id,
      recipient_id: recipient.id,
      section_id: sectionId,
      schema_key: section?.submission_schema_key ?? "rider_upload",
      rows: [manifestRow],
      received_via: "email_ingest",
    });
  }
}
