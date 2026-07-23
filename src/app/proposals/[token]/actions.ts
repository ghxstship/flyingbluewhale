"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createServiceClient, isServiceClientAvailable } from "@/lib/supabase/server";
import { ratelimit, RATE_BUDGETS } from "@/lib/ratelimit";
import { resolveProposalShareLink } from "@/lib/proposals/share";
import { formFail } from "@/lib/forms/fail";
import { notifyOrgAdmins } from "@/lib/notify";
import { sendEmail, wrapEmailHtml } from "@/lib/email";
import { log } from "@/lib/log";

const SignSchema = z.object({
  token: z.string().min(8),
  name: z.string().min(1).max(200),
  email: z.string().email().optional().or(z.literal("")),
  role: z.string().optional(),
  kind: z.enum(["typed", "canvas"]),
  data: z.string().max(200_000).optional(),
});

export type SignState = {
  error?: string;
  ok?: { hash: string; signedAt: string };
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

function randomRef() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Array.from(crypto.getRandomValues(new Uint8Array(6)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
  return `SIG-${ts}-${rand}`;
}

export async function signProposalAction(_: SignState, fd: FormData): Promise<SignState> {
  const parsed = SignSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);

  // IP-bucketed ratelimit on the public sign action. Without this, a
  // crawler that scrapes share links can brute-force `signer_name` /
  // `signer_email` values and rack up `signature_completed` events.
  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ?? hdrs.get("x-real-ip") ?? "unknown";
  const rate = await ratelimit({
    key: `proposal-sign:${ip}:${parsed.data.token}`,
    ...RATE_BUDGETS.auth,
  });
  if (!rate.ok) {
    return { error: "Too many signing attempts. Wait a moment and try again." };
  }

  // HMAC-verify (with legacy fallback) before touching the proposal row.
  // The consume RPC bumps view counters; signature is a side-effect of a
  // successful resolve so the view-count bump matches the audit trail.
  const resolved = await resolveProposalShareLink({
    token: parsed.data.token,
    allowLegacyTokenFallback: true,
  });
  if (!resolved.ok) {
    return {
      error:
        resolved.reason === "expired"
          ? "This share link has expired"
          : resolved.reason === "revoked"
            ? "This share link has been revoked"
            : "Share link is invalid",
    };
  }

  if (!isServiceClientAvailable()) {
    return { error: "Signing is temporarily unavailable. Please try again later." };
  }
  const svc = createServiceClient();

  const hash = randomRef();
  const signedAt = new Date().toISOString();

  // Conditional proposal update FIRST. The .neq("proposal_state","signed") guard
  // refuses to overwrite an existing signature — without it a second
  // signer (or a stale tab) would clobber the legally-binding signer
  // metadata + hash on a proposal that's already executed.
  const { data: signed, error: updateErr } = await svc
    .from("proposals")
    .update({
      signed_at: signedAt,
      signer_name: parsed.data.name,
      signer_email: parsed.data.email || null,
      signature_hash: hash,
      signature_data: parsed.data.data?.slice(0, 180_000) ?? null,
      proposal_state: "signed",
    })
    .eq("id", resolved.link.proposal_id)
    .neq("proposal_state", "signed")
    .select("id");
  if (updateErr) return { error: updateErr.message };
  if (!signed || signed.length === 0) {
    return { error: "Proposal is already signed" };
  }

  // Insert the signature audit row + event ONLY after the proposal
  // claims the signature. This way a re-attempt doesn't leave orphan
  // signature rows or duplicate signature_completed events.
  const userAgent = hdrs.get("user-agent");
  const { error: sigErr } = await svc.from("proposal_signatures").insert({
    proposal_id: resolved.link.proposal_id,
    share_token: parsed.data.token,
    signer_name: parsed.data.name,
    signer_email: parsed.data.email || null,
    signer_role: parsed.data.role ?? null,
    signature_kind: parsed.data.kind,
    signature_hash: hash,
    signature_data: parsed.data.data?.slice(0, 180_000) ?? null,
    // E-20: signature evidence — the IP was already resolved for the
    // ratelimit bucket above.
    signer_ip: ip === "unknown" ? null : ip,
  });
  if (sigErr) return { error: sigErr.message };

  const { error: eventErr } = await svc.from("proposal_events").insert({
    proposal_id: resolved.link.proposal_id,
    share_token: parsed.data.token,
    event_type: "signature_completed",
    metadata: {
      name: parsed.data.name,
      kind: parsed.data.kind,
      // E-20: user agent joins the evidence trail (no dedicated column).
      user_agent: userAgent ? userAgent.slice(0, 500) : null,
    },
  });
  if (eventErr) return { error: eventErr.message };

  // ── E-04: close the loop on both sides. Best-effort — the signature is
  // already committed; a notify/email failure must not surface as a sign
  // failure to the signer.
  try {
    const { data: proposal } = await svc
      .from("proposals")
      .select("org_id, title, doc_number")
      .eq("id", resolved.link.proposal_id)
      .maybeSingle();
    if (proposal) {
      const label = proposal.doc_number ? `${proposal.doc_number} · ${proposal.title}` : proposal.title;
      await notifyOrgAdmins({
        orgId: proposal.org_id,
        eventType: "proposal.signed",
        title: "Proposal Signed",
        body: `${parsed.data.name} signed "${label}".`,
        href: `/studio/proposals/${resolved.link.proposal_id}`,
        data: { targetTable: "proposals", targetId: resolved.link.proposal_id, hash },
      });
      if (parsed.data.email) {
        const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        await sendEmail({
          to: parsed.data.email,
          subject: `Signed: ${label}`,
          html: wrapEmailHtml(
            `<h2 style="margin:0 0 12px">Your signature is recorded</h2>
             <p style="margin:0 0 8px">Thank you, ${esc(parsed.data.name)}. You signed <strong>${esc(label)}</strong> on ${new Date(signedAt).toUTCString()}.</p>
             <p style="margin:0;color:#666">Signature reference: <code>${hash}</code>. Keep this email as your receipt.</p>`,
          ),
          text: `Your signature is recorded.\n\n${parsed.data.name} signed "${label}" on ${new Date(signedAt).toUTCString()}.\nSignature reference: ${hash}`,
        });
      }
    }
  } catch (e) {
    log.warn("proposal.sign_notify_failed", {
      proposalId: resolved.link.proposal_id,
      err: e instanceof Error ? e.message : String(e),
    });
  }

  revalidatePath(`/proposals/${parsed.data.token}`);
  return { ok: { hash, signedAt } };
}
