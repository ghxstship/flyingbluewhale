"use client";

import Link from "next/link";
import { useActionState } from "react";
import { AuthCard } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { signupAction, type FormState } from "../actions";

export function SignupForm() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(signupAction, null);

  return (
    <AuthCard title="Create account" subtitle="Start running production in minutes.">
      <form action={formAction} className="space-y-4">
        <Input label="Name" name="name" required autoComplete="name" />
        <Input label="Email" name="email" type="email" required autoComplete="email" />
        <Input label="Password" name="password" type="password" required autoComplete="new-password" minLength={8} />
        <Input label="Organization" name="orgName" placeholder="Optional" autoComplete="organization" />
        {state?.error ? (
          <div className="rounded border border-[color:var(--color-error)]/40 bg-[color:var(--color-error)]/10 p-2 text-xs text-[color:var(--color-error)]">
            {state.error}
          </div>
        ) : null}
        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? "Creating…" : "Sign up"}
        </Button>
      </form>
      <div className="mt-4 text-mono text-xs text-[var(--color-text-tertiary)]">
        Already have an account? <Link href="/login" className="text-[var(--brand-color)]">Log in</Link>
      </div>
    </AuthCard>
  );
}
