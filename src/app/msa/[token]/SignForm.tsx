"use client";

import { useState } from "react";
import { FormShell, type FormState } from "@/components/FormShell";
import { FormField, TextInput } from "@/components/forms/FormField";
import { signMsa } from "./actions";

const EXHIBIT_B_ROWS = 3;
const EXHIBIT_C_ROWS = 4;

const inputCls = "ps-input focus-ring w-full";

export function SignForm({ token, showChapter624 }: { token: string; showChapter624: boolean }) {
  const [confirmed, setConfirmed] = useState(false);

  const action = async (prev: FormState, fd: FormData) => {
    return (await signMsa(token, prev as never, fd)) as FormState;
  };

  return (
    <FormShell action={action} submitLabel="Sign &amp; Submit" className="surface space-y-6 p-6">
      <div className="space-y-3">
        <h3 className="text-sm font-semibold tracking-wider text-[var(--p-text-2)] uppercase">
          Exhibit B — Other Clients
        </h3>
        <p className="text-xs text-[var(--p-text-2)]">
          List at least two (2) clients you&rsquo;ve served with substantially similar services in the past 24 months.
          Leave rows blank if you have fewer to disclose.
        </p>
        <div className="space-y-2">
          {Array.from({ length: EXHIBIT_B_ROWS }).map((_, i) => (
            <div key={i} className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <input name={`exhibit_b_${i}_client`} placeholder={`Client ${i + 1}`} className={inputCls} />
              <input name={`exhibit_b_${i}_project`} placeholder="Project / Engagement" className={inputCls} />
              <input name={`exhibit_b_${i}_dates`} placeholder="Dates (e.g. Q3 2025)" className={inputCls} />
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold tracking-wider text-[var(--p-text-2)] uppercase">
          Exhibit C — Capital Investment
        </h3>
        <p className="text-xs text-[var(--p-text-2)]">
          Itemize what you bring to the table — business entity, insurance, equipment, tools, certifications, etc.
        </p>
        <div className="space-y-2">
          {Array.from({ length: EXHIBIT_C_ROWS }).map((_, i) => (
            <div key={i} className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <input
                name={`exhibit_c_${i}_label`}
                placeholder={
                  i === 0
                    ? "Business entity"
                    : i === 1
                      ? "Insurance"
                      : i === 2
                        ? "Tools / Equipment"
                        : "Item / Category"
                }
                className={inputCls}
              />
              <input name={`exhibit_c_${i}_description`} placeholder="Description / value" className={inputCls} />
            </div>
          ))}
        </div>
      </div>

      {showChapter624 && (
        <div className="space-y-3 rounded border border-[var(--border-default)] bg-[var(--p-surface-2)] p-4">
          <h3 className="text-sm font-semibold tracking-wider text-[var(--p-text-2)] uppercase">
            NSCB License — Chapter 624
          </h3>
          <p className="text-xs text-[var(--p-text-2)]">
            Required for trade scopes that fall within NRS Chapter 624 (carpentry, electrical, rigging, etc.). Skip if
            not applicable.
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <input name="nscb_license" placeholder="License # (e.g. 0012345)" className={inputCls} />
            <input name="nscb_classification" placeholder="Classification (e.g. C-3)" className={inputCls} />
            <input
              name="nscb_monetary_limit_cents"
              inputMode="numeric"
              placeholder="Monetary limit ($ cents, e.g. 50000000)"
              className={inputCls}
            />
          </div>
        </div>
      )}

      <label className="flex items-start gap-3 rounded border border-[var(--border-default)] p-4 text-sm">
        <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="mt-1" />
        <span>
          I am authorized to sign this Agreement on behalf of myself or my business entity. The representations made in
          Exhibits B and C are true and correct to the best of my knowledge.
        </span>
      </label>

      <FormField name="signature" label="Signature · Type Your Full Legal Name" required>
        <TextInput
          name="signature"
          placeholder="Your full legal name"
          required
          disabled={!confirmed}
          className="ps-input font-subdisplay text-xl tracking-wide"
        />
      </FormField>
    </FormShell>
  );
}
