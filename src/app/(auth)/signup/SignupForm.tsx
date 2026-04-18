"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";
import toast from "react-hot-toast";
import { AuthShell } from "@/components/auth/AuthShell";
import { OAuthButtons, AuthDivider } from "@/components/auth/OAuthButtons";
import { PasswordField } from "@/components/auth/PasswordField";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { signupAction, type FormState } from "../actions";

export function SignupForm() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(signupAction, null);

  useEffect(() => {
    if (state?.error && !state?.fieldErrors) toast.error(state.error);
  }, [state]);

  return (
    <AuthShell
      title="Create your account"
      subtitle="Free forever on the Portal tier. No credit card."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="text-[var(--org-primary)] underline-offset-4 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <OAuthButtons />
      <AuthDivider />
      <form action={formAction} className="space-y-4" noValidate>
        <Input
          label="Name"
          name="name"
          required
          autoComplete="name"
          error={state?.fieldErrors?.name}
        />
        <Input
          label="Work email"
          name="email"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          error={state?.fieldErrors?.email}
        />
        <PasswordField
          name="password"
          label="Password"
          required
          minLength={8}
          autoComplete="new-password"
          showStrength
          hint="At least 8 characters"
          error={state?.fieldErrors?.password}
        />
        <Input
          label="Organization"
          name="orgName"
          placeholder="Optional"
          autoComplete="organization"
          hint="You can create this later from settings."
          error={state?.fieldErrors?.orgName}
        />
        {state?.error && !state?.fieldErrors && (
          <div
            role="alert"
            className="rounded border border-[color:var(--color-error)]/40 bg-[color:var(--color-error)]/10 p-2 text-xs text-[color:var(--color-error)]"
          >
            {state.error}
          </div>
        )}
        <p className="text-[11px] leading-relaxed text-[var(--text-muted)]">
          By creating an account you agree to our{" "}
          <Link href="/legal/terms" className="underline">Terms</Link> and{" "}
          <Link href="/legal/privacy" className="underline">Privacy Policy</Link>.
        </p>
        <Button type="submit" size="lg" className="w-full" loading={pending}>
          {pending ? "Creating account" : "Create account"}
        </Button>
      </form>
    </AuthShell>
  );
}
