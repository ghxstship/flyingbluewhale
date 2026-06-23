"use client";

import { useActionState, useState } from "react";
import { SignaturePad } from "@/components/ui/SignaturePad";
import { submitSignatureAction, type State } from "./actions";

export type PublicSignProps = {
  token: string;
  labels: {
    nameLabel: string;
    titleLabel: string;
    drawLabel: string;
    submit: string;
    submitting: string;
    noSignature: string;
    error: string;
  };
};

export function PublicSign({ token, labels }: PublicSignProps) {
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
            className="w-full rounded-md border border-[var(--p-border)] bg-[var(--p-bg)] px-3 py-2 text-sm"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-xs font-medium text-[var(--p-text-2)]">{labels.titleLabel}</span>
          <input
            name="signed_title"
            className="w-full rounded-md border border-[var(--p-border)] bg-[var(--p-bg)] px-3 py-2 text-sm"
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

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={busy || !image}
          className="rounded-[var(--p-r,8px)] bg-[var(--p-accent-cta)] px-5 py-2.5 text-sm font-semibold text-[var(--p-accent-cta-contrast)] transition-[filter] hover:brightness-95 disabled:opacity-50"
        >
          {busy ? labels.submitting : labels.submit}
        </button>
        {!image && <span className="text-xs text-[var(--p-text-3)]">{labels.noSignature}</span>}
        {state?.error && <span className="text-sm text-[var(--p-danger-text)]">{state.error || labels.error}</span>}
      </div>
    </form>
  );
}
