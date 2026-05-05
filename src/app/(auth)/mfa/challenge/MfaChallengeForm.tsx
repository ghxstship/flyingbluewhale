"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { verifyChallengeAction } from "./actions";
import type { FormState } from "@/components/FormShell";

export function MfaChallengeForm({ factorId, next }: { factorId: string; next: string }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(verifyChallengeAction, null);
  const [code, setCode] = useState("");
  const [useRecovery, setUseRecovery] = useState(false);

  useEffect(() => {
    if (state?.error) toast.error(state.error);
  }, [state]);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <input type="hidden" name="factorId" value={factorId} />
      <input type="hidden" name="next" value={next} />

      {useRecovery ? (
        <Input
          label="Recovery code"
          name="code"
          autoComplete="one-time-code"
          required
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="abcd1234-5678efgh"
          hint="Enter one of the recovery codes you saved when you enrolled."
        />
      ) : (
        <Input
          label="Authenticator code"
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]{6}"
          maxLength={6}
          required
          autoFocus
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          placeholder="123 456"
        />
      )}

      {state?.error && <Alert kind="error">{state.error}</Alert>}

      <Button type="submit" size="lg" className="w-full" loading={pending} disabled={!useRecovery && code.length !== 6}>
        {pending ? "Verifying" : "Verify"}
      </Button>

      <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
        <button
          type="button"
          onClick={() => {
            setUseRecovery((v) => !v);
            setCode("");
          }}
          className="underline-offset-4 hover:underline"
        >
          {useRecovery ? "Use authenticator code" : "Use a recovery code"}
        </button>
        <Link href="/auth/signout" className="hover:text-[var(--text-primary)]">
          Sign out
        </Link>
      </div>
    </form>
  );
}
