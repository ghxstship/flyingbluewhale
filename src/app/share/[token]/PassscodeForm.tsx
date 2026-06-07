"use client";

import { useActionState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { submitPasscode, type PasscodeFormState } from "./actions";

/**
 * Passcode-protected share-link gate. Submits to a server action that calls
 * `consumeShareLink` with the entered passcode and either redirects to the
 * resource or surfaces an error. Wrong passcodes do NOT consume a use.
 *
 * This component is intentionally tiny — no FormShell, no extra chrome. The
 * unauth /share/[token] page is its own minimal surface.
 */
export function PassscodeForm({ token, label }: { token: string; label?: string | null }) {
  const [state, formAction, pending] = useActionState<PasscodeFormState, FormData>(submitPasscode, null);
  return (
    <form action={formAction} className="surface space-y-4 p-6">
      <input type="hidden" name="token" value={token} />
      <div>
        <h1 className="text-lg font-semibold tracking-tight">Passcode required</h1>
        <p className="mt-1 text-sm text-[var(--p-text-2)]">
          {label
            ? `This shared link (“${label}”) is protected by a passcode.`
            : "This shared link is protected by a passcode."}
        </p>
      </div>
      <div>
        <label htmlFor="share-passcode" className="mb-1 block text-sm font-medium">
          Passcode
        </label>
        <input
          id="share-passcode"
          name="passcode"
          type="password"
          autoComplete="off"
          autoFocus
          required
          minLength={1}
          maxLength={128}
          className="ps-input w-full"
        />
      </div>
      {state?.error && <Alert kind="error">{state.error}</Alert>}
      <div className="flex justify-end">
        <Button type="submit" loading={pending}>
          {pending ? "Checking" : "Unlock"}
        </Button>
      </div>
    </form>
  );
}
