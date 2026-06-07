"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { acceptInviteAction } from "../../actions";
import type { FormState } from "@/components/FormShell";
import { useT } from "@/lib/i18n/LocaleProvider";

export function AcceptInviteForm({ token }: { token: string }) {
  const t = useT();
  const [state, formAction, pending] = useActionState<FormState, FormData>(acceptInviteAction, null);

  useEffect(() => {
    if (state?.error) toast.error(state.error);
  }, [state]);

  return (
    <AuthShell
      title={t("auth.acceptInvite.title", undefined, "Join your team")}
      subtitle={t("auth.acceptInvite.subtitle", undefined, "Accept your invitation to ATLVS Technologies")}
      footer={
        <Link href="/login" className="text-[var(--p-accent)] underline underline-offset-4">
          {t("auth.acceptInvite.signInInstead", undefined, "Sign in instead")}
        </Link>
      }
    >
      <p className="text-sm text-[var(--p-text-2)]">
        {t(
          "auth.acceptInvite.body",
          undefined,
          "You've been invited to a ATLVS Technologies workspace. Accept below and we'll take you straight in.",
        )}
      </p>
      {state?.error && (
        <Alert kind="error" className="mt-4">
          {state.error}
        </Alert>
      )}
      <form action={formAction} className="mt-6">
        <input type="hidden" name="token" value={token} />
        <Button type="submit" size="lg" className="w-full" loading={pending}>
          {pending
            ? t("auth.acceptInvite.submitting", undefined, "Joining…")
            : t("auth.acceptInvite.submit", undefined, "Accept invite")}
        </Button>
      </form>
    </AuthShell>
  );
}
