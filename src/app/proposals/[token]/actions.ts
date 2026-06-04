"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createServiceClient, isServiceClientAvailable } from "@/lib/supabase/server";
import { ratelimit, RATE_BUDGETS } from "@/lib/ratelimit";
import { resolveProposalShareLink } from "@/lib/proposals/share";

const SignSchema = z.object({
  token: z.string().min(8),
  name: z.string().min(1).max(200),
  email: z.string().email().optional().or(z.literal("")),
  role: z.string().optional(),
  kind: z.enum(["typed", "canvas"]),
  data: z.string().max(200_000).optional(),
});

export type SignState = { error?: string; ok?: { hash: string; signedAt: string } } | null;

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
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

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
    return { error: "Too many signing attempts — wait a moment and try again." };
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

  // Conditional proposal update FIRST. The .neq("status","signed") guard
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
      status: "signed",
    })
    .eq("id", resolved.link.proposal_id)
    .neq("status", "signed")
    .select("id");
  if (updateErr) return { error: updateErr.message };
  if (!signed || signed.length === 0) {
    return { error: "Proposal is already signed" };
  }

  // Insert the signature audit row + event ONLY after the proposal
  // claims the signature. This way a re-attempt doesn't leave orphan
  // signature rows or duplicate signature_completed events.
  await svc.from("proposal_signatures").insert({
    proposal_id: resolved.link.proposal_id,
    share_token: parsed.data.token,
    signer_name: parsed.data.name,
    signer_email: parsed.data.email || null,
    signer_role: parsed.data.role ?? null,
    signature_kind: parsed.data.kind,
    signature_hash: hash,
    signature_data: parsed.data.data?.slice(0, 180_000) ?? null,
  });

  await svc.from("proposal_events").insert({
    proposal_id: resolved.link.proposal_id,
    share_token: parsed.data.token,
    event_type: "signature_completed",
    metadata: { name: parsed.data.name, kind: parsed.data.kind },
  });

  revalidatePath(`/proposals/${parsed.data.token}`);
  return { ok: { hash, signedAt } };
}
