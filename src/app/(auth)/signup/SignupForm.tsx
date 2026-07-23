"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";
import { toast } from "@/lib/hooks/useToast";
import { AuthShell } from "@/components/auth/AuthShell";
import { OAuthButtons } from "@/components/auth/OAuthButtons";
import { Divider } from "@/components/ui/Divider";
import { PasswordField } from "@/components/auth/PasswordField";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Input } from "@/components/ui/Input";
import { signupAction } from "../actions";
import type { FormState } from "@/components/FormShell";
import { PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH } from "@/lib/validation/constraints";
import { useT } from "@/lib/i18n/LocaleProvider";

const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  crew: "Crew",
  production: "Production",
  festival: "Festival",
};

export function SignupForm({ plan }: { plan?: string }) {
  const t = useT();
  const [state, formAction, pending] = useActionState<FormState, FormData>(signupAction, null);

  useEffect(() => {
    if (state?.error && !state?.fieldErrors) toast.error(state.error);
  }, [state]);

  return (
    <AuthShell
      title={t("auth.signup.title", undefined, "Start building your world")}
      subtitle={t(
        "auth.signup.subtitle",
        undefined,
        "Free forever on the Access tier. No credit card. Be running in minutes.",
      )}
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
      <Divider label="or continue with email" labelStyle="eyebrow" className="my-5" />
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
          minLength={PASSWORD_MIN_LENGTH}
          maxLength={PASSWORD_MAX_LENGTH}
          autoComplete="new-password"
          showStrength
          hint={t("auth.signup.passwordHelp", undefined, "At least 8 characters")}
          error={state?.fieldErrors?.password}
        />
        {/* C7 — org capture deferred to /onboarding/org (which owns workspace
            creation). Fewer fields on the highest-friction screen. */}
        {/* E-17: recorded plan intent from the pricing CTA. Honest copy — no
            billing/trial mechanics exist yet, so nothing is promised. */}
        {plan && (
          <>
            <input type="hidden" name="plan" value={plan} />
            <p className="text-[11px] leading-relaxed text-[var(--p-text-2)]">
              {t(
                "auth.signup.planIntent",
                { plan: PLAN_LABELS[plan] ?? plan },
                `You picked the ${PLAN_LABELS[plan] ?? plan} plan. Every workspace starts on the free Access tier; we'll keep your choice with your new workspace so upgrading is one step.`,
              )}
            </p>
          </>
        )}
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
