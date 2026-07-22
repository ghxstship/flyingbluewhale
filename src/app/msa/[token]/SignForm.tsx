"use client";

import { useState } from "react";
import { FormShell, type FormState } from "@/components/FormShell";
import { FormField, TextInput } from "@/components/forms/FormField";
import { useT } from "@/lib/i18n/LocaleProvider";
import { signMsa } from "./actions";

const EXHIBIT_B_ROWS = 3;
const EXHIBIT_C_ROWS = 4;

const inputCls = "ps-input focus-ring w-full";

export function SignForm({ token, showChapter624 }: { token: string; showChapter624: boolean }) {
  const t = useT();
  const [confirmed, setConfirmed] = useState(false);

  const action = async (prev: FormState, fd: FormData) => {
    return (await signMsa(token, prev as never, fd)) as FormState;
  };

  const exhibitCLabels = [
    t("legal.msaSign.exhibitCBusinessEntity", undefined, "Business entity"),
    t("legal.msaSign.exhibitCInsurance", undefined, "Insurance"),
    t("legal.msaSign.exhibitCToolsEquipment", undefined, "Tools / Equipment"),
    t("legal.msaSign.exhibitCItemCategory", undefined, "Item / Category"),
  ];

  return (
    <FormShell
      action={action}
      submitLabel={t("legal.msaSign.submit", undefined, "Sign & Submit")}
      className="surface space-y-6 p-6"
    >
      <div className="space-y-3">
        <h3 className="text-sm font-semibold tracking-wider text-[var(--p-text-2)] uppercase">
          {t("legal.msaSign.exhibitBHeading", undefined, "Exhibit B — Other Clients")}
        </h3>
        <p className="text-xs text-[var(--p-text-2)]">
          {t(
            "legal.msaSign.exhibitBHint",
            undefined,
            "List at least two (2) clients you've served with substantially similar services in the past 24 months. Leave rows blank if you have fewer to disclose.",
          )}
        </p>
        <div className="space-y-2">
          {Array.from({ length: EXHIBIT_B_ROWS }).map((_, i) => (
            <div key={i} className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <input
                name={`exhibit_b_${i}_client`}
                placeholder={t("legal.msaSign.exhibitBClientPlaceholder", { n: i + 1 }, `Client ${i + 1}`)}
                className={inputCls}
              />
              <input
                name={`exhibit_b_${i}_project`}
                placeholder={t("legal.msaSign.exhibitBProjectPlaceholder", undefined, "Project / Engagement")}
                className={inputCls}
              />
              <input
                name={`exhibit_b_${i}_dates`}
                placeholder={t("legal.msaSign.exhibitBDatesPlaceholder", undefined, "Dates · e.g. Q3 2025")}
                className={inputCls}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold tracking-wider text-[var(--p-text-2)] uppercase">
          {t("legal.msaSign.exhibitCHeading", undefined, "Exhibit C — Capital Investment")}
        </h3>
        <p className="text-xs text-[var(--p-text-2)]">
          {t(
            "legal.msaSign.exhibitCHint",
            undefined,
            "Itemize what you bring to the table — business entity, insurance, equipment, tools, certifications, etc.",
          )}
        </p>
        <div className="space-y-2">
          {Array.from({ length: EXHIBIT_C_ROWS }).map((_, i) => (
            <div key={i} className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <input
                name={`exhibit_c_${i}_label`}
                placeholder={exhibitCLabels[Math.min(i, exhibitCLabels.length - 1)]}
                className={inputCls}
              />
              <input
                name={`exhibit_c_${i}_description`}
                placeholder={t("legal.msaSign.exhibitCDescriptionPlaceholder", undefined, "Description / value")}
                className={inputCls}
              />
            </div>
          ))}
        </div>
      </div>

      {showChapter624 && (
        <div className="space-y-3 rounded border border-[var(--p-border)] bg-[var(--p-surface-2)] p-4">
          <h3 className="text-sm font-semibold tracking-wider text-[var(--p-text-2)] uppercase">
            {t("legal.msaSign.nscbHeading", undefined, "NSCB License — Chapter 624")}
          </h3>
          <p className="text-xs text-[var(--p-text-2)]">
            {t(
              "legal.msaSign.nscbHint",
              undefined,
              "Required for trade scopes that fall within NRS Chapter 624 — carpentry, electrical, rigging, etc. Skip if not applicable.",
            )}
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <input
              name="nscb_license"
              placeholder={t("legal.msaSign.nscbLicensePlaceholder", undefined, "License # · e.g. 0012345")}
              className={inputCls}
            />
            <input
              name="nscb_classification"
              placeholder={t("legal.msaSign.nscbClassificationPlaceholder", undefined, "Classification · e.g. C-3")}
              className={inputCls}
            />
            <input
              name="nscb_monetary_limit_cents"
              inputMode="numeric"
              placeholder={t(
                "legal.msaSign.nscbMonetaryLimitPlaceholder",
                undefined,
                "Monetary limit · $ cents, e.g. 50000000",
              )}
              className={inputCls}
            />
          </div>
        </div>
      )}

      <label className="flex items-start gap-3 rounded border border-[var(--p-border)] p-4 text-sm">
        <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="mt-1" />
        <span>
          {t(
            "legal.msaSign.attestation",
            undefined,
            "I am authorized to sign this Agreement on behalf of myself or my business entity. The representations made in Exhibits B and C are true and correct to the best of my knowledge.",
          )}
        </span>
      </label>

      <FormField
        name="signature"
        label={t("legal.msaSign.signatureLabel", undefined, "Signature · Type Your Full Legal Name")}
        required
      >
        <TextInput
          name="signature"
          placeholder={t("legal.msaSign.signaturePlaceholder", undefined, "Your full legal name")}
          required
          disabled={!confirmed}
          className="ps-input font-subdisplay text-xl tracking-wide"
        />
      </FormField>
    </FormShell>
  );
}
