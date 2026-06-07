"use client";

import { FormShell, type FormState } from "@/components/FormShell";
import { FormField, NativeSelect } from "@/components/forms/FormField";
import { useT } from "@/lib/i18n/LocaleProvider";
import type { CrewMemberOption } from "@/lib/offer-letters/types";
import { createMsa } from "./actions";

export function NewMsaForm({ crew }: { crew: CrewMemberOption[] }) {
  const t = useT();
  const action = async (prev: FormState, fd: FormData) => {
    return (await createMsa(prev as never, fd)) as FormState;
  };
  return (
    <FormShell
      action={action}
      submitLabel={t("console.people.msas.new.submit", undefined, "Create Draft MSA")}
      className="surface max-w-xl space-y-4 p-6"
    >
      <FormField
        name="crew_member_id"
        label={t("console.people.msas.new.contractorLabel", undefined, "Contractor")}
        required
      >
        <NativeSelect name="crew_member_id" required defaultValue="">
          <option value="" disabled>
            {t("console.people.msas.new.pickCrewMember", undefined, "Pick a crew member…")}
          </option>
          {crew.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
              {m.email ? ` · ${m.email}` : ""}
              {m.role ? ` · ${m.role}` : ""}
            </option>
          ))}
        </NativeSelect>
      </FormField>
      <p className="text-xs text-[var(--p-text-2)]">
        {t(
          "console.people.msas.new.helperText",
          undefined,
          "We’ll generate a private link and 6-character access code. Email those to the contractor — they fill Exhibits B/C and counter-sign. The MSA then applies to every future engagement letter we issue them.",
        )}
      </p>
    </FormShell>
  );
}
