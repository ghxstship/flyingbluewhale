"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { AuthShell } from "@/components/auth/AuthShell";
import { OAuthButtons, AuthDivider } from "@/components/auth/OAuthButtons";
import { PasswordField } from "@/components/auth/PasswordField";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Input } from "@/components/ui/Input";
import { loginAction } from "../actions";
import type { FormState } from "@/components/FormShell";
import { useT } from "@/lib/i18n/LocaleProvider";

export function LoginForm() {
  const t = useT();
  const [state, formAction, pending] = useActionState<FormState, FormData>(loginAction, null);

  useEffect(() => {
    if (state?.error && !state?.fieldErrors) toast.error(state.error);
  }, [state]);

  return (
    <AuthShell
      title={t("auth.login.title", undefined, "Sign in")}
      subtitle={t("auth.login.subtitle", undefined, "Welcome back. Pick up where you left off.")}
      footer={
        <>
          {t("auth.login.noAccount", undefined, "Don't have an account?")}{" "}
          <Link href="/signup" className="text-[var(--org-primary)] underline underline-offset-4">
            {t("auth.login.createOne", undefined, "Create one")}
          </Link>
        </>
      }
    >
      <OAuthButtons />
      <AuthDivider />
      <form action={formAction} className="space-y-4" noValidate>
        <Input
          label={t("auth.login.email", undefined, "Email")}
          name="email"
          type="email"
          required
          autoComplete="email"
          error={state?.fieldErrors?.email}
        />
        <PasswordField
          name="password"
          label={t("auth.login.password", undefined, "Password")}
          required
          autoComplete="current-password"
          error={state?.fieldErrors?.password}
        />
        {state?.error && !state?.fieldErrors && <Alert kind="error">{state.error}</Alert>}
        <Button type="submit" size="lg" className="w-full" loading={pending}>
          {pending
            ? t("auth.login.submitting", undefined, "Signing in…")
            : t("auth.login.submit", undefined, "Sign in")}
        </Button>
      </form>
      <div className="mt-4 flex items-center justify-between text-xs">
        <Link href="/forgot-password" className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
          {t("auth.login.forgotPassword", undefined, "Forgot password?")}
        </Link>
        <Link href="/magic-link" className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
          {t("auth.login.emailMeALink", undefined, "Email me a link")}
        </Link>
      </div>
    </AuthShell>
  );
}
