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
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-[var(--org-primary)] underline underline-offset-4">
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
          <Alert kind="error">{state.error}</Alert>
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
