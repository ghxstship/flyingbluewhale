"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";

export type State = { error?: string; ok?: true } | null;

async function db(): Promise<LooseSupabase> {
  return (await createClient()) as unknown as LooseSupabase;
}

const ApplySchema = z.object({
  envelope_id: z.string().uuid(),
  signer_id: z.string().uuid(),
  signed_name: z.string().trim().min(1).max(200),
  signed_title: z.string().trim().max(200).optional().or(z.literal("")),
  // data:image/png;base64,... — bounded so a forged payload can't bloat the row.
  signature_image: z.string().startsWith("data:image/").max(2_000_000),
});

/** Apply the operator's own signature to one signer row on the envelope. */
export async function applySignatureAction(_: State, fd: FormData): Promise<State> {
  const parsed = ApplySchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Add your name and a signature first." };
  const session = await requireSession();
  const supabase = await db();
  const { envelope_id, signer_id, signed_name, signed_title, signature_image } = parsed.data;
  const { error } = await supabase
    .from("contract_envelope_signers")
    .update({
      signer_state: "signed",
      signed_name,
      signed_title: signed_title || null,
      signed_at: new Date().toISOString(),
      signature_image,
    })
    .eq("id", signer_id)
    .eq("envelope_id", envelope_id)
    .eq("org_id", session.orgId);
  if (error) return { error: "Could not save the signature." };
  revalidatePath(`/studio/envelopes/${envelope_id}/prepare`);
  revalidatePath(`/studio/envelopes/${envelope_id}`);
  return { ok: true };
}

/** Generate (or rotate) a public signing token for a signer. */
export async function createSigningLinkAction(envelopeId: string, signerId: string): Promise<void> {
  const session = await requireSession();
  const supabase = await db();
  const token = randomUUID().replace(/-/g, "");
  await supabase
    .from("contract_envelope_signers")
    .update({ sign_token: token })
    .eq("id", signerId)
    .eq("envelope_id", envelopeId)
    .eq("org_id", session.orgId);
  revalidatePath(`/studio/envelopes/${envelopeId}/prepare`);
}
