"use client";

import { useActionState } from "react";
import Link from "next/link";
import { uploadPersonalDoc, type State } from "./docs-action";

import { useActionErrorResolver } from "@/lib/errors-client";
/**
 * Portal-native "Upload document" form (ADR-0008 Amendment 4).
 *
 * Upload looks like it should be camera-bound — one of the three field
 * capabilities that pin a write to COMPVSS — but it isn't. The mobile form
 * carries no `capture` attribute on purpose, so the control is an OS file
 * picker that happens to offer the camera on a phone. Every desktop browser
 * has a file picker. So the portal owns its own upload, and the 20 MB cap +
 * service-role storage path live in the shared action either way.
 */

const DOC_KINDS: { value: string; label: string }[] = [
  { value: "id", label: "ID" },
  { value: "license", label: "License Or Certification" },
  { value: "tax", label: "Tax Form" },
  { value: "contract", label: "Contract" },
  { value: "medical", label: "Medical" },
  { value: "other", label: "Other" },
];

export function DocUploadForm({ revalidate, backHref }: { revalidate: string; backHref: string }) {
  const [state, formAction, pending] = useActionState<State, FormData>(uploadPersonalDoc, null);
  const resolveErr = useActionErrorResolver();

  return (
    <form action={formAction} encType="multipart/form-data">
      <input type="hidden" name="revalidate" value={revalidate} />
      <input type="hidden" name="redirectTo" value={backHref} />

      {state?.error && (
        <div className="ps-alert ps-alert--danger mb-4" role="alert">
          {resolveErr(state.error)}
        </div>
      )}

      <div className="fld">
        <label className="lbl" htmlFor="label">
          Label
        </label>
        <input
          id="label"
          name="label"
          className="ps-input"
          required
          maxLength={200}
          placeholder="e.g. Forklift ticket"
          defaultValue={state?.values?.label ?? ""}
        />
        {state?.fieldErrors?.label && <div className="fld-err">{state.fieldErrors.label}</div>}
      </div>

      <div className="fld mt-4">
        <label className="lbl" htmlFor="doc_kind">
          Type
        </label>
        <select id="doc_kind" name="doc_kind" className="ps-input" defaultValue={state?.values?.doc_kind ?? "other"}>
          {DOC_KINDS.map((k) => (
            <option key={k.value} value={k.value}>
              {k.label}
            </option>
          ))}
        </select>
        {state?.fieldErrors?.doc_kind && <div className="fld-err">{state.fieldErrors.doc_kind}</div>}
      </div>

      <div className="fld mt-4">
        <label className="lbl" htmlFor="file">
          File
        </label>
        <input id="file" name="file" type="file" className="ps-input" required accept="image/*,application/pdf" />
        <p className="mt-2 text-xs text-[var(--p-text-2)]">
          Photo or PDF, up to 20 MB. Only you and your managers can see it.
        </p>
      </div>

      <div className="mt-6 flex gap-2">
        <Link href={backHref} className="ps-btn ps-btn--tertiary">
          Cancel
        </Link>
        <button type="submit" className="ps-btn ps-btn--cta" disabled={pending}>
          {pending ? "Uploading…" : "Upload"}
        </button>
      </div>
    </form>
  );
}
