"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";
import toast from "react-hot-toast";
import { AuthShell } from "@/components/auth/AuthShell";
import { OAuthButtons, AuthDivider } from "@/components/auth/OAuthButtons";
import { PasswordField } from "@/components/auth/PasswordField";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { loginAction, type FormState } from "../actions";

export function LoginForm() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(loginAction, null);

  useEffect(() => {
    if (state?.error && !state?.fieldErrors) toast.error(state.error);
  }, [state]);

  return (
    <AuthShell
      title="Sign in"
      subtitle="Welcome back. Pick up where you left off."
      footer={
        <>
          Don't have an account?{" "}
          <Link href="/signup" className="text-[var(--org-primary)] underline-offset-4 hover:underline">
            Create one
          </Link>
        </>
      }
    >
      <OAuthButtons />
      <AuthDivider />
      <form action={formAction} className="space-y-4" noValidate>
        <Input
          label="Email"
          name="email"
          type="email"
          required
          autoComplete="email"
          error={state?.fieldErrors?.email}
        />
        <PasswordField
          name="password"
          label="Password"
          required
          autoComplete="current-password"
          error={state?.fieldErrors?.password}
        />
        {state?.error && !state?.fieldErrors && (
          <div
            role="alert"
            className="rounded border border-[color:var(--color-error)]/40 bg-[color:var(--color-error)]/10 p-2 text-xs text-[color:var(--color-error)]"
          >
            {state.error}
          </div>
        )}
        <Button type="submit" size="lg" className="w-full" loading={pending}>
          {pending ? "Signing in" : "Sign in"}
        </Button>
      </form>
      <div className="mt-4 flex items-center justify-between text-xs">
        <Link
          href="/forgot-password"
          className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        >
          Forgot password?
        </Link>
        <Link
          href="/magic-link"
          className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        >
          Email me a link
        </Link>
      </div>
    </AuthShell>
  );
}
