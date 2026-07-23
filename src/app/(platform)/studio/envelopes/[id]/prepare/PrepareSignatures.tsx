"use client";

import { useActionState, useState } from "react";
import { SignaturePad } from "@/components/ui/SignaturePad";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { applySignatureAction, createSigningLinkAction, type State } from "./actions";

export type PrepareSigner = {
  id: string;
  label: string;
  role: string | null;
  signerState: string;
  signedName: string | null;
  signUrl: string | null;
};

export type PrepareSignaturesProps = {
  envelopeId: string;
  signers: PrepareSigner[];
  labels: {
    applyHeading: string;
    signerSelect: string;
    nameLabel: string;
    titleLabel: string;
    drawLabel: string;
    clear: string;
    apply: string;
    applying: string;
    applied: string;
    error: string;
    noSignature: string;
    linksHeading: string;
    createLink: string;
    copyHint: string;
    signed: string;
  };
};

export function PrepareSignatures({ envelopeId, signers, labels }: PrepareSignaturesProps) {
  const pending = signers.filter((s) => s.signerState !== "signed");
  const [signerId, setSignerId] = useState(pending[0]?.id ?? signers[0]?.id ?? "");
  const [image, setImage] = useState("");
  const [state, formAction, busy] = useActionState<State, FormData>(applySignatureAction, null);

  return (
    <div className="space-y-8">
      <section className="space-y-4 rounded-[var(--p-r,8px)] border border-[var(--p-border)] bg-[var(--p-surface)] p-5">
        <h2 className="text-sm font-semibold text-[var(--p-text-1)]">{labels.applyHeading}</h2>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="envelope_id" value={envelopeId} />
          <input type="hidden" name="signer_id" value={signerId} />
          <input type="hidden" name="signature_image" value={image} />

          <div className="grid gap-3 sm:grid-cols-3">
            <label className="text-sm">
              <span className="mb-1 block text-xs font-medium text-[var(--p-text-2)]">{labels.signerSelect}</span>
              <select
                value={signerId}
                onChange={(e) => setSignerId(e.target.value)}
                className="ps-input w-full"
              >
                {signers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-xs font-medium text-[var(--p-text-2)]">{labels.nameLabel}</span>
              <input
                name="signed_name"
                className="ps-input w-full"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-xs font-medium text-[var(--p-text-2)]">{labels.titleLabel}</span>
              <input
                name="signed_title"
                className="ps-input w-full"
              />
            </label>
          </div>

          <div>
            <span className="mb-1 block text-xs font-medium text-[var(--p-text-2)]">{labels.drawLabel}</span>
            <SignaturePad
              height={180}
              onChange={setImage}
              onClear={() => setImage("")}
              className="rounded-md border border-[var(--p-border)] bg-[var(--p-bg)] text-[var(--p-text-1)]"
            />
          </div>

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={busy || !image || !signerId}>
              {busy ? labels.applying : labels.apply}
            </Button>
            {!image && <span className="text-xs text-[var(--p-text-3)]">{labels.noSignature}</span>}
            {state?.ok && <span className="text-sm text-[var(--p-success-text)]">{labels.applied}</span>}
            {state?.error && <span className="text-sm text-[var(--p-danger-text)]">{labels.error}</span>}
          </div>
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-[var(--p-text-1)]">{labels.linksHeading}</h2>
        <ul className="divide-y divide-[var(--p-border)] rounded-[var(--p-r,8px)] border border-[var(--p-border)]">
          {signers.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-sm font-medium text-[var(--p-text-1)]">
                  {s.label}
                  {s.signerState === "signed" && <Badge variant="success">{labels.signed}</Badge>}
                </div>
                {s.signUrl && (
                  <code className="mt-0.5 block truncate font-mono text-xs text-[var(--p-text-3)]">{s.signUrl}</code>
                )}
              </div>
              {s.signerState !== "signed" && (
                <form action={createSigningLinkAction.bind(null, envelopeId, s.id)}>
                  <Button type="submit" variant="secondary" size="sm">
                    {labels.createLink}
                  </Button>
                </form>
              )}
            </li>
          ))}
        </ul>
        <p className="text-xs text-[var(--p-text-3)]">{labels.copyHint}</p>
      </section>
    </div>
  );
}
