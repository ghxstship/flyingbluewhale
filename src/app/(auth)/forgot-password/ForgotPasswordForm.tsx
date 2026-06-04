"use client";

import Link from "next/link";
import { useActionState } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Input } from "@/components/ui/Input";
import { forgotPasswordAction } from "../actions";
import type { FormState } from "@/components/FormShell";
import { useT } from "@/lib/i18n/LocaleProvider";

export function ForgotPasswordForm() {
  const t = useT();
  const [state, formAction, pending] = useActionState<FormState, FormData>(forgotPasswordAction, null);
  const sent = state !== null && !state?.error;

  return (
    <AuthShell
      title={t("auth.forgotPassword.title", undefined, "Forgot password")}
      subtitle={
        sent
          ? t("auth.forgotPassword.sentSubtitle", undefined, "Check your inbox for the reset link")
          : t("auth.forgotPassword.subtitle", undefined, "We'll email you a reset link")
      }
      footer={
        <Link href="/login" className="text-[var(--org-primary)] underline underline-offset-4">
          {t("auth.forgotPassword.backToLogin", undefined, "Back to sign in")}
        </Link>
      }
    >
      {sent ? (
        <div role="status" aria-live="polite" className="surface p-4 text-sm text-[var(--text-secondary)]">
          {t(
            "auth.forgotPassword.sentBody",
            undefined,
            "If an account exists for that email, the reset link is on its way. The link expires in 60 minutes.",
          )}
        </div>
      ) : (
        <form action={formAction} className="space-y-4" noValidate>
          <Input
            label={t("auth.login.email", undefined, "Email")}
            name="email"
            type="email"
            required
            autoComplete="email"
          />
          {state?.error && <Alert kind="error">{state.error}</Alert>}
          <Button type="submit" size="lg" className="w-full" loading={pending}>
            {pending
              ? t("auth.magicLink.submitting", undefined, "Sending")
              : t("auth.forgotPassword.submit", undefined, "Send reset link")}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
