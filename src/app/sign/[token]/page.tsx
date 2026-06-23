import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { PublicSign } from "./PublicSign";

export const dynamic = "force-dynamic";

type SignerLookup = {
  id: string;
  signer_state: string;
  signer_role: string | null;
  signed_name: string | null;
  envelope: { title: string | null } | null;
};

/**
 * /sign/[token] — public, anonymous e-signature surface (kit v7 SignaturePad
 * archetype). Token-gated: reached only via an emailed/shared signing link, so
 * it is EXEMPT from nav reconciliation. Resolves the signer by token through
 * the service client; the SignaturePad capture posts back through a
 * service-scoped action.
 */
export default async function SignPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!hasSupabase) return notFound();
  const supabase = createServiceClient() as unknown as LooseSupabase;
  const { data } = await supabase
    .from("contract_envelope_signers")
    .select("id, signer_state, signer_role, signed_name, envelope:envelope_id(title)")
    .eq("sign_token", token)
    .maybeSingle();
  const signer = data as SignerLookup | null;
  if (!signer) notFound();

  const docTitle = signer.envelope?.title ?? "Document";
  const alreadySigned = signer.signer_state === "signed";

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-8 px-6 py-12">
      <header className="space-y-2">
        <p className="font-mono text-xs tracking-[0.14em] text-[var(--p-accent-text)] uppercase">ATLVS · E-Sign</p>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--p-text-1)]">{docTitle}</h1>
        <p className="text-[var(--p-text-2)]">
          {alreadySigned
            ? "This document has been signed. Thank you."
            : "Review the document, then add your name and signature below to complete it."}
        </p>
      </header>

      {alreadySigned ? (
        <div className="rounded-[var(--p-r,8px)] border border-[var(--p-border)] bg-[var(--p-surface)] p-6">
          <p className="text-sm text-[var(--p-text-2)]">
            Signed by <span className="font-medium text-[var(--p-text-1)]">{signer.signed_name ?? "—"}</span>.
          </p>
        </div>
      ) : (
        <section className="rounded-[var(--p-r,8px)] border border-[var(--p-border)] bg-[var(--p-surface)] p-6">
          <PublicSign
            token={token}
            labels={{
              nameLabel: "Full name",
              titleLabel: "Title (optional)",
              drawLabel: "Draw your signature",
              submit: "Sign document",
              submitting: "Submitting…",
              noSignature: "Draw a signature to enable signing",
              error: "Could not record your signature",
            }}
          />
        </section>
      )}
    </main>
  );
}
