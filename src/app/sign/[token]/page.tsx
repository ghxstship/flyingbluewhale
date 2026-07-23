import { notFound } from "next/navigation";
import { formatDateParts } from "@/lib/i18n/format";
import { createServiceClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { SignArea } from "./SignArea";
import { PrintButton } from "./PrintButton";

export const dynamic = "force-dynamic";

type EnvelopeLookup = {
  subject: string | null;
  body_md: string | null;
  document_path: string | null;
  envelope_state: string | null;
  expires_at: string | null;
} | null;

type SignerLookup = {
  id: string;
  signer_state: string;
  signer_role: string | null;
  signed_name: string | null;
  signed_title: string | null;
  signed_at: string | null;
  signature_image: string | null;
  envelope: EnvelopeLookup;
};

const CONSENT_COPY =
  "By clicking Sign document you consent to do business electronically and agree that your drawn signature, " +
  "typed name, IP address, and timestamp will be recorded as evidence of your agreement to this document. " +
  "It carries the same legal effect as a handwritten signature.";

/**
 * /sign/[token] — public, anonymous e-signature surface (kit v7 SignaturePad
 * archetype). Token-gated: reached only via an emailed/shared signing link, so
 * it is EXEMPT from nav reconciliation. Resolves the signer by token through
 * the service client; the SignaturePad capture posts back through a
 * service-scoped action.
 *
 * E-02: the envelope's actual content (subject + body + attached document via
 * signed URL) renders above the pad, and signing is gated on scroll-through.
 * E-19: voided / declined / expired envelopes and past `expires_at` are
 * terminal states; a signed copy remains viewable and printable after signing.
 */
export default async function SignPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!hasSupabase) return notFound();
  const service = createServiceClient();
  const supabase = service as unknown as LooseSupabase;
  const { data } = await supabase
    .from("contract_envelope_signers")
    .select(
      "id, signer_state, signer_role, signed_name, signed_title, signed_at, signature_image, envelope:envelope_id(subject, body_md, document_path, envelope_state, expires_at)",
    )
    .eq("sign_token", token)
    .maybeSingle();
  const signer = data as SignerLookup | null;
  if (!signer) notFound();

  const env = signer.envelope;
  const docTitle = env?.subject ?? "Document";
  const alreadySigned = signer.signer_state === "signed";

  // ── E-19: envelope lifecycle gating ───────────────────────────────────────
  const envState = env?.envelope_state ?? null;
  const terminal =
    envState === "voided" || envState === "declined" || envState === "expired"
      ? envState
      : signer.signer_state === "voided" || signer.signer_state === "declined"
        ? signer.signer_state
        : null;
  const linkExpired =
    !alreadySigned && !terminal && Boolean(env?.expires_at && new Date(env.expires_at).getTime() < Date.now());

  if ((terminal && !alreadySigned) || linkExpired) {
    const message =
      terminal === "voided"
        ? "This envelope has been voided by the sender and can no longer be signed."
        : terminal === "declined"
          ? "This envelope was declined and can no longer be signed."
          : "This signing link has expired. Ask the sender to issue a new one.";
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-8 px-6 py-12">
        <header className="space-y-2">
          <p className="font-mono text-xs tracking-[0.14em] text-[var(--p-accent-text)] uppercase">ATLVS · E-Sign</p>
          <h1 className="text-[var(--p-text-1)]">{docTitle}</h1>
        </header>
        <div className="rounded-[var(--p-r,8px)] border border-[var(--p-border)] bg-[var(--p-surface)] p-6">
          <p className="text-sm text-[var(--p-text-2)]">{message}</p>
        </div>
      </main>
    );
  }

  // Attached document (if any) — served through a short-lived signed URL.
  // `document_path` convention: `<bucket>/<object-path>`.
  let documentUrl: string | null = null;
  if (env?.document_path) {
    try {
      const [bucket, ...rest] = env.document_path.split("/");
      if (bucket && rest.length > 0) {
        const { data: signedUrl } = await service.storage.from(bucket).createSignedUrl(rest.join("/"), 600);
        documentUrl = signedUrl?.signedUrl ?? null;
      }
    } catch {
      documentUrl = null;
    }
  }

  const documentContent = (
    <article className="space-y-4">
      <h2 className="text-lg font-semibold text-[var(--p-text-1)]">{docTitle}</h2>
      {env?.body_md ? (
        <div className="text-sm leading-relaxed whitespace-pre-wrap text-[var(--p-text-1)]">{env.body_md}</div>
      ) : !documentUrl ? (
        <p className="text-sm text-[var(--p-text-2)]">
          The sender did not attach document text to this envelope. Contact them if you expected to review terms
          here before signing.
        </p>
      ) : null}
      {documentUrl && (
        <iframe
          src={documentUrl}
          title={docTitle}
          className="h-[70vh] w-full rounded-md border border-[var(--p-border)] bg-white"
        />
      )}
    </article>
  );

  if (alreadySigned) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-8 px-6 py-12">
        <header className="space-y-2">
          <p className="font-mono text-xs tracking-[0.14em] text-[var(--p-accent-text)] uppercase">ATLVS · E-Sign</p>
          <h1 className="text-[var(--p-text-1)]">{docTitle}</h1>
          <p className="text-[var(--p-text-2)]">This document has been signed. Thank you.</p>
        </header>

        <div className="rounded-[var(--p-r,8px)] border border-[var(--p-border)] bg-[var(--p-surface)] p-6">
          {documentContent}
        </div>

        <div className="rounded-[var(--p-r,8px)] border border-[var(--p-border)] bg-[var(--p-surface)] p-6">
          <h2 className="text-sm font-semibold tracking-wider text-[var(--p-text-2)] uppercase">Signature</h2>
          {signer.signature_image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={signer.signature_image}
              alt={`Signature of ${signer.signed_name ?? "signer"}`}
              className="mt-3 max-h-28 rounded-md border border-[var(--p-border)] bg-white p-2"
            />
          )}
          <p className="mt-3 text-sm text-[var(--p-text-2)]">
            Signed by <span className="font-medium text-[var(--p-text-1)]">{signer.signed_name ?? "—"}</span>
            {signer.signed_title ? `, ${signer.signed_title}` : ""}
            {signer.signed_at
              ? ` on ${formatDateParts(new Date(signer.signed_at), { month: "long", day: "numeric", year: "numeric" }, { timezone: "UTC" })}`
              : ""}
            .
          </p>
          <div className="mt-4">
            <PrintButton label="Download / print signed copy" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-8 px-6 py-12">
      <header className="space-y-2">
        <p className="font-mono text-xs tracking-[0.14em] text-[var(--p-accent-text)] uppercase">ATLVS · E-Sign</p>
        <h1 className="text-[var(--p-text-1)]">{docTitle}</h1>
        <p className="text-[var(--p-text-2)]">
          Review the full document below, then add your name and signature to complete it.
        </p>
      </header>

      <SignArea
        token={token}
        scrollHint="Scroll to the end of the document to enable signing."
        labels={{
          nameLabel: "Full name",
          titleLabel: "Title (optional)",
          drawLabel: "Draw your signature",
          submit: "Sign document",
          submitting: "Submitting…",
          noSignature: "Draw a signature to enable signing",
          error: "Could not record your signature",
          consent: CONSENT_COPY,
          docAriaLabel: `Document: ${docTitle}`,
        }}
      >
        {documentContent}
      </SignArea>
    </main>
  );
}
