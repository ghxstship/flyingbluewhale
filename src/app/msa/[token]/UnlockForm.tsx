"use client";

import { FormShell, type FormState } from "@/components/FormShell";
import { FormField, TextInput } from "@/components/forms/FormField";
import { unlockMsa } from "./actions";

export function UnlockForm({ token, expired = false }: { token: string; expired?: boolean }) {
  const action = async (prev: FormState, fd: FormData) => {
    return (await unlockMsa(token, prev as never, fd)) as FormState;
  };

  return (
    <div className="mx-auto max-w-md space-y-6 py-12">
      <div className="space-y-2 text-center">
        <div className="font-mono text-xs tracking-widest text-[var(--text-muted)] uppercase">
          GHXSTSHIP Industries LLC
        </div>
        <h1 className="text-2xl font-semibold">Master Services Agreement</h1>
        <p className="text-sm text-[var(--text-muted)]">
          {expired
            ? "Your session expired or the access code changed. Re-enter the 6-character access code that was sent with this link."
            : "Enter the 6-character access code that was sent with this link to view your MSA."}
        </p>
      </div>

      <FormShell action={action} submitLabel="Open MSA" className="surface space-y-4 p-6">
        <FormField name="access_code" label="Access Code" required>
          <TextInput
            name="access_code"
            autoComplete="off"
            autoFocus
            inputMode="text"
            maxLength={6}
            placeholder="ABC123"
            className="input-base focus-ring text-center font-mono text-2xl tracking-[0.4em] uppercase"
          />
        </FormField>
        <p className="text-center text-xs text-[var(--text-muted)]">
          Trouble? Contact{" "}
          <a className="underline" href="mailto:julian.clarkson@ghxstship.pro">
            julian.clarkson@ghxstship.pro
          </a>
        </p>
      </FormShell>
    </div>
  );
}
