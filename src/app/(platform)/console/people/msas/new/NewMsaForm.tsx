"use client";

import { FormShell, type FormState } from "@/components/FormShell";
import { FormField, NativeSelect } from "@/components/forms/FormField";
import type { CrewMemberOption } from "@/lib/offer-letters/types";
import { createMsa } from "./actions";

export function NewMsaForm({ crew }: { crew: CrewMemberOption[] }) {
  const action = async (prev: FormState, fd: FormData) => {
    return (await createMsa(prev as never, fd)) as FormState;
  };
  return (
    <FormShell action={action} submitLabel="Create Draft MSA" className="surface max-w-xl space-y-4 p-6">
      <FormField name="crew_member_id" label="Contractor" required>
        <NativeSelect name="crew_member_id" required defaultValue="">
          <option value="" disabled>
            Pick a crew member…
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
      <p className="text-xs text-[var(--text-muted)]">
        We&rsquo;ll generate a private link and 6-character access code. Email those to the contractor — they fill
        Exhibits B/C and counter-sign. The MSA then applies to every future engagement letter we issue them.
      </p>
    </FormShell>
  );
}
