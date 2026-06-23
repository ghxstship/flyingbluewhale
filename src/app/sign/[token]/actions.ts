"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";

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

/**
 * Public (anonymous) signature submission. Resolves the signer by token via the
 * service client and scopes the mutation to that single matched row — no anon
 * RLS grant is required. Already-signed tokens are rejected.
 */
export async function submitSignatureAction(_: State, fd: FormData): Promise<State> {
  const parsed = SubmitSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Add your name and a signature first." };
  const { token, signed_name, signed_title, signature_image } = parsed.data;
  const supabase = svc();

  const { data: signer } = await supabase
    .from("contract_envelope_signers")
    .select("id, signer_state, envelope_id")
    .eq("sign_token", token)
    .maybeSingle();
  if (!signer) return { error: "This signing link is invalid or has expired." };
  const row = signer as { id: string; signer_state: string; envelope_id: string };
  if (row.signer_state === "signed") return { error: "This document has already been signed." };

  const { error } = await supabase
    .from("contract_envelope_signers")
    .update({
      signer_state: "signed",
      signed_name,
      signed_title: signed_title || null,
      signed_at: new Date().toISOString(),
      signature_image,
    })
    .eq("id", row.id);
  if (error) return { error: "Could not record your signature. Please try again." };

  revalidatePath(`/sign/${token}`);
  return { ok: true };
}
