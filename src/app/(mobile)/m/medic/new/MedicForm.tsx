"use client";

import { useActionState } from "react";
import { toast } from "sonner";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { SignatureField } from "@/components/SignatureField";
import { logEncounter, type State } from "./actions";

const TRIAGE = [
  { value: "green", label: "Green", hint: "Minor — non-urgent" },
  { value: "yellow", label: "Yellow", hint: "Urgent — within 30 min" },
  { value: "red", label: "Red", hint: "Immediate — life-threatening" },
  { value: "black", label: "Black", hint: "Deceased / expectant" },
] as const;

export function MedicForm() {
  const [state, formAction, pending] = useActionState<State, FormData>(async (prev, fd) => {
    const result = await logEncounter(prev, fd);
    if (result?.error) toast.error(result.error);
    return result;
  }, null);

  return (
    <form action={formAction} className="space-y-5">
      <fieldset className="space-y-2">
        <legend className="text-xs font-medium text-[var(--text-secondary)]">Triage *</legend>
        <div className="grid grid-cols-2 gap-2">
          {TRIAGE.map((t) => (
            <label
              key={t.value}
              className="surface flex cursor-pointer flex-col gap-0.5 p-3 text-sm has-[:checked]:ring-2 has-[:checked]:ring-[var(--org-primary)]"
            >
              <span className="flex items-center gap-2">
                <input type="radio" name="triage" value={t.value} required className="accent-[var(--org-primary)]" />
                <span className="font-semibold">{t.label}</span>
              </span>
              <span className="ms-5 text-xs text-[var(--text-muted)]">{t.hint}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label className="text-xs font-medium text-[var(--text-secondary)]">Patient Reference</label>
        <input
          name="patient_ref"
          maxLength={120}
          placeholder="Pseudonymous ID — never a name"
          className="input-base mt-1.5 w-full"
        />
        <p className="mt-1 text-[10px] text-[var(--text-muted)]">
          Use the wristband number, accreditation barcode, or ad-hoc code. Never a real name.
        </p>
      </div>

      <div>
        <label className="text-xs font-medium text-[var(--text-secondary)]">Chief Complaint *</label>
        <textarea
          name="chief_complaint"
          rows={4}
          maxLength={2000}
          required
          placeholder="What is the patient presenting with?"
          className="input-base mt-1.5 w-full"
        />
      </div>

      <div>
        <label className="text-xs font-medium text-[var(--text-secondary)]">Disposition</label>
        <input
          name="disposition"
          maxLength={160}
          placeholder="e.g. Discharged, Hospital transfer, Refused care"
          className="input-base mt-1.5 w-full"
        />
      </div>

      <div className="surface p-4">
        <SignatureField name="signature" label="Clinician Signature" />
        <p className="mt-2 text-[10px] text-[var(--text-muted)]">
          Signature is stored inside the encrypted PHI envelope of this encounter.
        </p>
      </div>

      {state?.error && <Alert kind="error">{state.error}</Alert>}

      <div className="flex items-center justify-end gap-2">
        <Button href="/m/medic" variant="ghost" size="sm">
          Cancel
        </Button>
        <Button type="submit" loading={pending} size="lg">
          {pending ? "Logging…" : "Log encounter"}
        </Button>
      </div>
    </form>
  );
}
