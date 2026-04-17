"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

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
    .map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
  return `SIG-${ts}-${rand}`;
}

export async function signProposalAction(_: SignState, fd: FormData): Promise<SignState> {
  const parsed = SignSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const supabase = await createClient();
  const { data: link } = await supabase
    .from("proposal_share_links")
    .select("*")
    .eq("token", parsed.data.token)
    .maybeSingle();
  if (!link || link.revoked_at || (link.expires_at && new Date(link.expires_at) < new Date())) {
    return { error: "Share link is invalid or expired" };
  }

  const hash = randomRef();
  const signedAt = new Date().toISOString();

  await supabase.from("proposal_signatures").insert({
    proposal_id: link.proposal_id,
    share_token: parsed.data.token,
    signer_name: parsed.data.name,
    signer_email: parsed.data.email || null,
    signer_role: parsed.data.role ?? null,
    signature_kind: parsed.data.kind,
    signature_hash: hash,
    signature_data: parsed.data.data?.slice(0, 180_000) ?? null,
  });

  await supabase.from("proposals").update({
    signed_at: signedAt,
    signer_name: parsed.data.name,
    signer_email: parsed.data.email || null,
    signature_hash: hash,
    signature_data: parsed.data.data?.slice(0, 180_000) ?? null,
    status: "signed",
  }).eq("id", link.proposal_id);

  await supabase.from("proposal_events").insert({
    proposal_id: link.proposal_id,
    share_token: parsed.data.token,
    event_type: "signature_completed",
    metadata: { name: parsed.data.name, kind: parsed.data.kind },
  });

  revalidatePath(`/proposals/${parsed.data.token}`);
  return { ok: { hash, signedAt } };
}
