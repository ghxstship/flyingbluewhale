"use client";

import Link from "next/link";
import { useActionState } from "react";
import { AuthCard } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { loginAction, type FormState } from "../actions";

export function LoginForm() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(loginAction, null);

  return (
    <AuthCard title="Log in" subtitle="Welcome back.">
      <form action={formAction} className="space-y-4">
        <Input label="Email" name="email" type="email" required autoComplete="email" />
        <Input label="Password" name="password" type="password" required autoComplete="current-password" />
        {state?.error ? (
          <div className="rounded border border-[color:var(--color-error)]/40 bg-[color:var(--color-error)]/10 p-2 text-xs text-[color:var(--color-error)]">
            {state.error}
          </div>
        ) : null}
        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? "Signing in…" : "Continue"}
        </Button>
      </form>
      <div className="mt-4 flex justify-between text-mono text-xs text-[var(--color-text-tertiary)]">
        <Link href="/forgot-password">Forgot password?</Link>
        <Link href="/signup">Create account</Link>
      </div>
    </AuthCard>
  );
}
