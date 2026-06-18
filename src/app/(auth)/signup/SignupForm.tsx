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
import { signupAction } from "../actions";
import type { FormState } from "@/components/FormShell";
import { useT } from "@/lib/i18n/LocaleProvider";

export function SignupForm() {
  const t = useT();
  const [state, formAction, pending] = useActionState<FormState, FormData>(signupAction, null);

  useEffect(() => {
    if (state?.error && !state?.fieldErrors) toast.error(state.error);
  }, [state]);

  return (
    <AuthShell
      title={t("auth.signup.title", undefined, "Start building your world")}
      subtitle={t("auth.signup.subtitle", undefined, "Free forever on the Access tier. No credit card. Be running in minutes.")}
      footer={
        <>
          {t("auth.signup.haveAccount", undefined, "Already have an account?")}{" "}
          <Link href="/login" className="text-[var(--p-accent-text)] underline underline-offset-4">
            {t("auth.signup.signIn", undefined, "Sign in")}
          </Link>
        </>
      }
    >
      <OAuthButtons />
      <AuthDivider />
      <form action={formAction} className="space-y-4" noValidate>
        <Input
          label={t("auth.signup.name", undefined, "Name")}
          name="name"
          required
          autoComplete="name"
          error={state?.fieldErrors?.name}
        />
        <Input
          label={t("auth.signup.email", undefined, "Work email")}
          name="email"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          error={state?.fieldErrors?.email}
        />
        <PasswordField
          name="password"
          label={t("auth.signup.password", undefined, "Password")}
          required
          minLength={8}
          autoComplete="new-password"
          showStrength
          hint={t("auth.signup.passwordHelp", undefined, "At least 8 characters")}
          error={state?.fieldErrors?.password}
        />
        {/* C7 — org capture deferred to /onboarding/org (which owns workspace
            creation). Fewer fields on the highest-friction screen. */}
        {state?.error && !state?.fieldErrors && <Alert kind="error">{state.error}</Alert>}
        <p className="text-[11px] leading-relaxed text-[var(--p-text-2)]">
          {t("auth.signup.tosPrefix", undefined, "By creating an account you agree to our")}{" "}
          <Link href="/legal/terms" className="underline">
            {t("nav.legal.terms", undefined, "Terms")}
          </Link>{" "}
          {t("common.and", undefined, "and")}{" "}
          <Link href="/legal/privacy" className="underline">
            {t("auth.signup.privacyPolicy", undefined, "Privacy Policy")}
          </Link>
          .
        </p>
        <Button type="submit" size="lg" className="w-full" loading={pending}>
          {pending
            ? t("auth.signup.submitting", undefined, "Creating account…")
            : t("auth.signup.submit", undefined, "Create Account")}
        </Button>
      </form>
    </AuthShell>
  );
}
