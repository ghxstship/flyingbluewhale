"use client";

import { useActionState } from "react";
import Link from "next/link";
import { KIcon } from "@/components/mobile/kit";
import { useT } from "@/lib/i18n/LocaleProvider";
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
/** value → English fallback; display labels resolve through t() per kind. */
const DOC_KINDS: { value: string; fallback: string }[] = [
  { value: "id", fallback: "ID" },
  { value: "license", fallback: "License Or Certification" },
  { value: "tax", fallback: "Tax Form" },
  { value: "contract", fallback: "Contract" },
  { value: "medical", fallback: "Medical" },
  { value: "other", fallback: "Other" },
];

export default function NewDocPage() {
  const t = useT();
  const [state, formAction, pending] = useActionState<State, FormData>(uploadPersonalDoc, null);

  return (
    <div className="screen screen-anim">
      <div className="scr-eye">{t("m.documents.new.eyebrow", undefined, "Documents")}</div>
      <h1 className="scr-h" style={{ marginBottom: 12 }}>
        {t("m.documents.new.title", undefined, "Upload Document")}
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
        <input type="hidden" name="revalidate" value="/m/documents" />
        <input type="hidden" name="redirectTo" value="/m/documents" />

        <div className="fld">
          <label className="lbl" htmlFor="label">
            {t("m.documents.new.label", undefined, "Label")}
          </label>
          <input
            id="label"
            name="label"
            className="ps-input"
            required
            maxLength={200}
            placeholder={t("m.documents.new.labelPh", undefined, "e.g. Forklift ticket")}
            defaultValue={state?.values?.label ?? ""}
          />
          {state?.fieldErrors?.label && <div className="fld-err">{state.fieldErrors.label}</div>}
        </div>

        <div className="fld">
          <label className="lbl" htmlFor="doc_kind">
            {t("m.documents.new.type", undefined, "Type")}
          </label>
          <select id="doc_kind" name="doc_kind" className="ps-input" defaultValue={state?.values?.doc_kind ?? "other"}>
            {DOC_KINDS.map((k) => (
              <option key={k.value} value={k.value}>
                {t(`m.documents.kind.${k.value}`, undefined, k.fallback)}
              </option>
            ))}
          </select>
          {state?.fieldErrors?.doc_kind && <div className="fld-err">{state.fieldErrors.doc_kind}</div>}
        </div>

        <div className="fld">
          <label className="lbl" htmlFor="file">
            {t("m.documents.new.file", undefined, "File")}
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
            {t(
              "m.documents.new.fileHint",
              undefined,
              "Photo or PDF, up to 20 MB. Only you and your managers can see it.",
            )}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <Link href="/m/documents" className="ps-btn ps-btn--tertiary ps-btn--lg" style={{ flex: 1, justifyContent: "center" }}>
            {t("common.cancel", undefined, "Cancel")}
          </Link>
          <button
            type="submit"
            className="ps-btn ps-btn--cta ps-btn--lg"
            style={{ flex: 2, justifyContent: "center" }}
            disabled={pending}
          >
            <KIcon name="Upload" size={15} />{" "}
            {pending
              ? t("m.documents.new.uploading", undefined, "Uploading…")
              : t("m.documents.new.upload", undefined, "Upload")}
          </button>
        </div>
      </form>
    </div>
  );
}
