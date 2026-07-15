"use client";

import { useActionState } from "react";
import Link from "next/link";
import { KIcon } from "@/components/mobile/kit";
import { uploadPersonalDoc, type State } from "@/components/workforce/docs-action";

/**
 * COMPVSS · Upload Document.
 *
 * `uploadPersonalDoc` was written, complete and correct — 20 MB cap,
 * service-role upload into the `personal-documents` bucket, RLS-shaped
 * storage path, row insert — and had **zero callers**. No route, no file
 * input, nothing in nav. `/m/docs` was download-only, so the one real
 * upload path in the entire mobile shell was unreachable. This page is the
 * form it was missing.
 *
 * Deliberately NOT the kit `FormScreen`: its `file`/`photo` control is a
 * counter stub that uploads nothing (see the capture-layer work). This is a
 * native multipart form with a real `<input type="file">`, which is also the
 * only thing that gets a phone's camera and document scanner into the flow —
 * `capture` is honoured by the OS picker, so "take a photo of it" works
 * without any custom camera code.
 */
const DOC_KINDS: { value: string; label: string }[] = [
  { value: "id", label: "ID" },
  { value: "license", label: "License Or Certification" },
  { value: "tax", label: "Tax Form" },
  { value: "contract", label: "Contract" },
  { value: "medical", label: "Medical" },
  { value: "other", label: "Other" },
];

export default function NewDocPage() {
  const [state, formAction, pending] = useActionState<State, FormData>(uploadPersonalDoc, null);

  return (
    <div className="screen screen-anim">
      <div className="scr-eye">Documents</div>
      <h1 className="scr-h" style={{ marginBottom: 12 }}>
        Upload Document
      </h1>

      {state?.error && (
        <div className="ps-alert ps-alert--danger" role="alert" style={{ marginBottom: 12 }}>
          {state.error}
        </div>
      )}

      <form action={formAction} encType="multipart/form-data">
        {/* The action is shared with the portal (ADR-0008 Amendment 4), so each
            shell names its own list to return to rather than the action
            hardcoding COMPVSS's. */}
        <input type="hidden" name="revalidate" value="/m/docs" />
        <input type="hidden" name="redirectTo" value="/m/docs" />

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

        <div className="fld">
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

        <div className="fld">
          <label className="lbl" htmlFor="file">
            File
          </label>
          {/* No `capture` attribute: this accepts a camera shot OR a file
              from the device, and letting the OS picker decide is what makes
              "photograph my ticket" and "attach the PDF HR emailed me" the
              same control. 20 MB cap is enforced server-side. */}
          <input
            id="file"
            name="file"
            type="file"
            className="ps-input"
            required
            accept="image/*,application/pdf"
            style={{ paddingTop: 11, paddingBottom: 11 }}
          />
          <div className="s" style={{ marginTop: 6 }}>
            Photo or PDF, up to 20 MB. Only you and your managers can see it.
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <Link href="/m/docs" className="ps-btn ps-btn--tertiary ps-btn--lg" style={{ flex: 1, justifyContent: "center" }}>
            Cancel
          </Link>
          <button
            type="submit"
            className="ps-btn ps-btn--cta ps-btn--lg"
            style={{ flex: 2, justifyContent: "center" }}
            disabled={pending}
          >
            <KIcon name="Upload" size={15} /> {pending ? "Uploading…" : "Upload"}
          </button>
        </div>
      </form>
    </div>
  );
}
