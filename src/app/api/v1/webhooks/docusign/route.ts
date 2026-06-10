import { z } from "zod";
import { apiError, apiOk } from "@/lib/api";
import { createServiceClient, isServiceClientAvailable } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { log } from "@/lib/log";

/**
 * POST /api/v1/webhooks/docusign
 *
 * DocuSign Connect webhook. Maps envelope status transitions back to
 * our contract_envelopes table by provider_envelope_id. Updates the
 * envelope_state + completed_at; on per-signer completion, fills in
 * the signer's signed_at + signed_name + IP.
 *
 * Auth: DocuSign Connect supports HMAC-SHA256 over the request body
 * using a shared key configured in the connect listener. We verify
 * via the DOCUSIGN_CONNECT_HMAC env var.
 */

const EnvelopeStatusMap: Record<
  string,
  "drafted" | "sent" | "delivered" | "partially_signed" | "signed" | "completed" | "declined" | "voided" | "expired"
> = {
  created: "drafted",
  sent: "sent",
  delivered: "delivered",
  signed: "signed",
  completed: "completed",
  declined: "declined",
  voided: "voided",
  "voided.deleted": "voided",
  expired: "expired",
  "auto-responded": "expired",
};

const ConnectPayloadSchema = z.object({
  event: z.string(),
  data: z.object({
    envelopeId: z.string(),
    envelopeSummary: z
      .object({
        status: z.string().optional(),
        statusChangedDateTime: z.string().optional(),
        completedDateTime: z.string().optional(),
        recipients: z
          .object({
            signers: z.array(z.unknown()).optional(),
          })
          .optional(),
      })
      .optional(),
    recipients: z
      .object({
        signers: z
          .array(
            z.object({
              email: z.string().optional(),
              name: z.string().optional(),
              status: z.string().optional(),
              signedDateTime: z.string().optional(),
              clientUserId: z.string().optional(),
            }),
          )
          .optional(),
      })
      .optional(),
  }),
});

export const dynamic = "force-dynamic";

async function verifyHmac(req: Request, body: string): Promise<boolean> {
  const key = process.env.DOCUSIGN_CONNECT_HMAC;
  if (!key) {
    // Fail CLOSED in production: without the HMAC key, unsigned payloads
    // could forge envelope-completed events and flip contracts to signed.
    // Dev keeps the accept-and-warn convenience for manual testing.
    if (process.env.NODE_ENV === "production") {
      log.error("docusign_webhook.hmac_missing_in_production");
      return false;
    }
    log.warn("docusign_webhook.no_hmac");
    return true;
  }
  const got = req.headers.get("x-docusign-signature-1");
  if (!got) return false;
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey("raw", enc.encode(key), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
  ]);
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(body));
  const expected = Buffer.from(sig).toString("base64");
  // P0 hardening — replace `===` with constant-time compare so a
  // timing oracle can't probe the HMAC secret byte-by-byte. Length
  // mismatch is the first-failure case; treat it as forbidden without
  // running timingSafeEqual (which throws on different-length inputs).
  const expectedBuf = Buffer.from(expected);
  const gotBuf = Buffer.from(got);
  if (expectedBuf.length !== gotBuf.length) return false;
  const { timingSafeEqual } = await import("node:crypto");
  return timingSafeEqual(expectedBuf, gotBuf);
}

export async function POST(req: Request) {
  const rawBody = await req.text();
  if (!(await verifyHmac(req, rawBody))) {
    return apiError("forbidden", "Invalid DocuSign signature");
  }
  let json: unknown;
  try {
    json = JSON.parse(rawBody);
  } catch {
    return apiError("bad_request", "Invalid JSON body");
  }
  const parsed = ConnectPayloadSchema.safeParse(json);
  if (!parsed.success) return apiError("bad_request", parsed.error.issues[0]?.message ?? "Invalid Connect payload");

  if (!isServiceClientAvailable()) {
    return apiError(
      "service_unavailable",
      "This endpoint requires SUPABASE_SERVICE_ROLE_KEY in the runtime environment.",
    );
  }
  const supabase = createServiceClient() as unknown as LooseSupabase;
  const env = parsed.data.data;
  const summary = env.envelopeSummary ?? {};
  const statusRaw = summary.status?.toLowerCase() ?? "";
  const mapped = EnvelopeStatusMap[statusRaw] ?? "sent";

  // Find our envelope row by provider_envelope_id.
  const { data: row } = await supabase
    .from("contract_envelopes")
    .select("id, org_id")
    .eq("provider_envelope_id", env.envelopeId)
    .maybeSingle();
  type Row = { id: string; org_id: string };
  const eRow = row as Row | null;
  if (!eRow) {
    log.warn("docusign_webhook.no_match", { envelopeId: env.envelopeId, status_raw: statusRaw });
    return apiOk({ matched: false });
  }

  const completed = summary.completedDateTime ?? null;
  await supabase
    .from("contract_envelopes")
    .update({
      envelope_state: mapped,
      completed_at: completed,
      webhook_received_at: new Date().toISOString(),
    })
    .eq("id", eRow.id);

  // Update per-signer state.
  const signers = parsed.data.data.recipients?.signers ?? summary.recipients?.signers ?? [];
  for (const s of signers as Array<{
    email?: string;
    name?: string;
    status?: string;
    signedDateTime?: string;
  }>) {
    if (!s.email) continue;
    // Resolve internal user_id by email (one round-trip; sub-select in
    // PostgREST .or() isn't supported and would attempt-cast to numeric).
    const { data: userRow } = await supabase.from("users").select("id").eq("email", s.email).maybeSingle();
    type UserRow = { id: string };
    const userId = (userRow as UserRow | null)?.id ?? null;

    let q = supabase
      .from("contract_envelope_signers")
      .update({
        signer_state: (s.status ?? "pending").toLowerCase(),
        signed_at: s.signedDateTime ?? null,
        signed_name: s.name ?? null,
      })
      .eq("envelope_id", eRow.id);
    if (userId) q = q.or(`external_email.eq.${s.email},user_id.eq.${userId}`);
    else q = q.eq("external_email", s.email);
    await q;
  }

  return apiOk({ matched: true, mapped });
}
