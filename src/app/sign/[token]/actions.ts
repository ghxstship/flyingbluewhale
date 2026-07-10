"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { log } from "@/lib/log";

export type State = { error?: string; ok?: true } | null;

function svc(): LooseSupabase {
  return createServiceClient() as unknown as LooseSupabase;
}

const SubmitSchema = z.object({
  token: z.string().min(8).max(64),
  signed_name: z.string().trim().min(1).max(200),
  signed_title: z.string().trim().max(200).optional().or(z.literal("")),
  signature_image: z.string().startsWith("data:image/").max(2_000_000),
});

type SignerRow = {
  id: string;
  signer_state: string;
  envelope_id: string;
  envelope: { envelope_state: string | null; expires_at: string | null } | null;
};

/**
 * Public (anonymous) signature submission. Resolves the signer by token via the
 * service client and scopes the mutation to that single matched row — no anon
 * RLS grant is required. Already-signed tokens are rejected.
 *
 * E-19/E-20: envelope voided/declined/expired and past-`expires_at` links are
 * rejected server-side; the signer's IP + user agent are recorded as signature
 * evidence; envelope state rolls up (partially_signed → signed + completed_at)
 * as signers complete.
 */
export async function submitSignatureAction(_: State, fd: FormData): Promise<State> {
  const parsed = SubmitSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Add your name and a signature first." };
  const { token, signed_name, signed_title, signature_image } = parsed.data;
  const supabase = svc();

  const { data: signer } = await supabase
    .from("contract_envelope_signers")
    .select("id, signer_state, envelope_id, envelope:envelope_id(envelope_state, expires_at)")
    .eq("sign_token", token)
    .maybeSingle();
  if (!signer) return { error: "This signing link is invalid or has expired." };
  const row = signer as unknown as SignerRow;
  if (row.signer_state === "signed") return { error: "This document has already been signed." };
  if (row.signer_state === "voided" || row.signer_state === "declined") {
    return { error: "This signing request is no longer active." };
  }
  const envState = row.envelope?.envelope_state;
  if (envState === "voided" || envState === "declined" || envState === "expired") {
    return { error: "This envelope is no longer open for signing." };
  }
  if (row.envelope?.expires_at && new Date(row.envelope.expires_at).getTime() < Date.now()) {
    return { error: "This signing link has expired. Ask the sender to issue a new one." };
  }

  // E-20: capture signature evidence (IP + user agent) alongside the image.
  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ?? hdrs.get("x-real-ip") ?? null;
  const userAgent = hdrs.get("user-agent");

  const { error } = await supabase
    .from("contract_envelope_signers")
    .update({
      signer_state: "signed",
      signed_name,
      signed_title: signed_title || null,
      signed_at: new Date().toISOString(),
      signature_image,
      ip,
      user_agent: userAgent ? userAgent.slice(0, 1000) : null,
    })
    .eq("id", row.id)
    .neq("signer_state", "signed");
  if (error) return { error: "Could not record your signature. Please try again." };

  // Best-effort envelope-state rollup — a rollup failure never voids the
  // committed signature.
  try {
    const { data: siblings } = await supabase
      .from("contract_envelope_signers")
      .select("id, signer_state")
      .eq("envelope_id", row.envelope_id);
    const remaining = ((siblings ?? []) as Array<{ signer_state: string }>).filter(
      (s) => s.signer_state !== "signed" && s.signer_state !== "voided" && s.signer_state !== "declined",
    ).length;
    await supabase
      .from("contract_envelopes")
      .update(
        remaining === 0
          ? { envelope_state: "signed", completed_at: new Date().toISOString() }
          : { envelope_state: "partially_signed" },
      )
      .eq("id", row.envelope_id)
      .in("envelope_state", ["drafted", "sent", "delivered", "partially_signed"]);
  } catch (e) {
    log.warn("sign.envelope_rollup_failed", {
      envelopeId: row.envelope_id,
      err: e instanceof Error ? e.message : String(e),
    });
  }

  revalidatePath(`/sign/${token}`);
  return { ok: true };
}
