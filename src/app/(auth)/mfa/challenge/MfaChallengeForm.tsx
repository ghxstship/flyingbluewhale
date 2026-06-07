"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { verifyChallengeAction } from "./actions";
import type { FormState } from "@/components/FormShell";
import { useT } from "@/lib/i18n/LocaleProvider";

export function MfaChallengeForm({ factorId, next }: { factorId: string; next: string }) {
  const t = useT();
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
          label={t("auth.mfa.recoveryCode", undefined, "Recovery code")}
          name="code"
          autoComplete="one-time-code"
          required
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="abcd1234-5678efgh"
          hint={t("auth.mfa.recoveryHint", undefined, "Enter one of the recovery codes you saved when you enrolled.")}
        />
      ) : (
        <Input
          label={t("auth.mfa.authenticatorCode", undefined, "Authenticator code")}
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
        {pending ? t("auth.mfa.submitting", undefined, "Verifying") : t("auth.mfa.submit", undefined, "Verify")}
      </Button>

      <div className="flex items-center justify-between text-xs text-[var(--p-text-2)]">
        <button
          type="button"
          onClick={() => {
            setUseRecovery((v) => !v);
            setCode("");
          }}
          className="underline-offset-4 hover:underline"
        >
          {useRecovery
            ? t("auth.mfa.useAuthenticator", undefined, "Use authenticator code")
            : t("auth.mfa.useRecovery", undefined, "Use a recovery code")}
        </button>
        <Link href="/auth/signout" className="hover:text-[var(--p-text-1)]">
          {t("common.signOut", undefined, "Sign out")}
        </Link>
      </div>
    </form>
  );
}
