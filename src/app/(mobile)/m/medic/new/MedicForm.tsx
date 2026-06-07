"use client";

import { useActionState } from "react";
import { toast } from "sonner";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { SignatureField } from "@/components/SignatureField";
import { useT } from "@/lib/i18n/LocaleProvider";
import { logEncounter, type State } from "./actions";

export function MedicForm() {
  const t = useT();
  const TRIAGE = [
    {
      value: "green",
      label: t("m.medic.new.triage.green.label", undefined, "Green"),
      hint: t("m.medic.new.triage.green.hint", undefined, "Minor — non-urgent"),
    },
    {
      value: "yellow",
      label: t("m.medic.new.triage.yellow.label", undefined, "Yellow"),
      hint: t("m.medic.new.triage.yellow.hint", undefined, "Urgent — within 30 min"),
    },
    {
      value: "red",
      label: t("m.medic.new.triage.red.label", undefined, "Red"),
      hint: t("m.medic.new.triage.red.hint", undefined, "Immediate — life-threatening"),
    },
    {
      value: "black",
      label: t("m.medic.new.triage.black.label", undefined, "Black"),
      hint: t("m.medic.new.triage.black.hint", undefined, "Deceased / expectant"),
    },
  ] as const;

  const [state, formAction, pending] = useActionState<State, FormData>(async (prev, fd) => {
    const result = await logEncounter(prev, fd);
    if (result?.error) toast.error(result.error);
    return result;
  }, null);

  return (
    <form action={formAction} className="space-y-5">
      <fieldset className="space-y-2">
        <legend className="text-xs font-medium text-[var(--p-text-2)]">
          {t("m.medic.new.triageLegend", undefined, "Triage *")}
        </legend>
        <div className="grid grid-cols-2 gap-2">
          {TRIAGE.map((tier) => (
            <label
              key={tier.value}
              className="surface flex cursor-pointer flex-col gap-0.5 p-3 text-sm has-[:checked]:ring-2 has-[:checked]:ring-[var(--p-accent)]"
            >
              <span className="flex items-center gap-2">
                <input type="radio" name="triage" value={tier.value} required className="accent-[var(--p-accent)]" />
                <span className="font-semibold">{tier.label}</span>
              </span>
              <span className="ms-5 text-xs text-[var(--p-text-2)]">{tier.hint}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label className="text-xs font-medium text-[var(--p-text-2)]">
          {t("m.medic.new.patientRef.label", undefined, "Patient Reference")}
        </label>
        <input
          name="patient_ref"
          maxLength={120}
          placeholder={t("m.medic.new.patientRef.placeholder", undefined, "Pseudonymous ID — never a name")}
          className="ps-input mt-1.5 w-full"
        />
        <p className="mt-1 text-[10px] text-[var(--p-text-2)]">
          {t(
            "m.medic.new.patientRef.hint",
            undefined,
            "Use the wristband number, accreditation barcode, or ad-hoc code. Never a real name.",
          )}
        </p>
      </div>

      <div>
        <label className="text-xs font-medium text-[var(--p-text-2)]">
          {t("m.medic.new.chiefComplaint.label", undefined, "Chief Complaint *")}
        </label>
        <textarea
          name="chief_complaint"
          rows={4}
          maxLength={2000}
          required
          placeholder={t("m.medic.new.chiefComplaint.placeholder", undefined, "What is the patient presenting with?")}
          className="ps-input mt-1.5 w-full"
        />
      </div>

      <div>
        <label className="text-xs font-medium text-[var(--p-text-2)]">
          {t("m.medic.new.disposition.label", undefined, "Disposition")}
        </label>
        <input
          name="disposition"
          maxLength={160}
          placeholder={t(
            "m.medic.new.disposition.placeholder",
            undefined,
            "e.g. Discharged, Hospital transfer, Refused care",
          )}
          className="ps-input mt-1.5 w-full"
        />
      </div>

      <div className="surface p-4">
        <SignatureField name="signature" label={t("m.medic.new.signature.label", undefined, "Clinician Signature")} />
        <p className="mt-2 text-[10px] text-[var(--p-text-2)]">
          {t(
            "m.medic.new.signature.hint",
            undefined,
            "Signature is stored inside the encrypted PHI envelope of this encounter.",
          )}
        </p>
      </div>

      {state?.error && <Alert kind="error">{state.error}</Alert>}

      <div className="flex items-center justify-end gap-2">
        <Button href="/m/medic" variant="ghost" size="sm">
          {t("common.cancel", undefined, "Cancel")}
        </Button>
        <Button type="submit" loading={pending} size="lg">
          {pending
            ? t("m.medic.new.submit.loading", undefined, "Logging…")
            : t("m.medic.new.submit.idle", undefined, "Log encounter")}
        </Button>
      </div>
    </form>
  );
}
