"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import { SignaturePad } from "@/components/ui/SignaturePad";
import { submitSignatureAction, type State } from "./actions";

export type PublicSignProps = {
  token: string;
  /** Gate the submit until the signer has scrolled through the document. */
  disabled?: boolean;
  labels: {
    nameLabel: string;
    titleLabel: string;
    drawLabel: string;
    submit: string;
    submitting: string;
    noSignature: string;
    error: string;
    consent: string;
    docAriaLabel: string;
  };
};

export function PublicSign({ token, labels, disabled = false }: PublicSignProps) {
  const [image, setImage] = useState("");
  const [state, formAction, busy] = useActionState<State, FormData>(submitSignatureAction, null);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="signature_image" value={image} />

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">
          <span className="mb-1 block text-xs font-medium text-[var(--p-text-2)]">{labels.nameLabel}</span>
          <input
            name="signed_name"
            required
            disabled={disabled}
            className="w-full rounded-md border border-[var(--p-border)] bg-[var(--p-bg)] px-3 py-2 text-sm disabled:opacity-60"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-xs font-medium text-[var(--p-text-2)]">{labels.titleLabel}</span>
          <input
            name="signed_title"
            disabled={disabled}
            className="w-full rounded-md border border-[var(--p-border)] bg-[var(--p-bg)] px-3 py-2 text-sm disabled:opacity-60"
          />
        </label>
      </div>

      <div>
        <span className="mb-1 block text-xs font-medium text-[var(--p-text-2)]">{labels.drawLabel}</span>
        <SignaturePad
          height={200}
          onChange={setImage}
          onClear={() => setImage("")}
          className="rounded-md border border-[var(--p-border)] bg-[var(--p-bg)] text-[var(--p-text-1)]"
        />
      </div>

      {/* E-20: e-signature consent + evidence disclosure (ported from the
          offer-letter flow). */}
      <p className="text-xs leading-relaxed text-[var(--p-text-2)]">{labels.consent}</p>

      <div className="flex items-center gap-3">
        <Button type="submit" variant="cta" disabled={busy || disabled || !image}>
          {busy ? labels.submitting : labels.submit}
        </Button>
        {!image && !disabled && <span className="text-xs text-[var(--p-text-3)]">{labels.noSignature}</span>}
        {state?.error && <span className="text-sm text-[var(--p-danger-text)]">{state.error || labels.error}</span>}
      </div>
    </form>
  );
}
