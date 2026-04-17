"use client";

import Link from "next/link";
import { useActionState } from "react";
import { AuthCard } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { forgotPasswordAction, type FormState } from "../actions";

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(forgotPasswordAction, null);
  const sent = state !== null && !state?.error;

  return (
    <AuthCard title="Reset password" subtitle="We'll email you a reset link.">
      {sent ? (
        <p className="text-sm text-[var(--color-text-secondary)]">
          If an account exists for that email, the reset link is on its way.
        </p>
      ) : (
        <form action={formAction} className="space-y-4">
          <Input label="Email" name="email" type="email" required autoComplete="email" />
          {state?.error ? (
            <div className="rounded border border-[color:var(--color-error)]/40 bg-[color:var(--color-error)]/10 p-2 text-xs text-[color:var(--color-error)]">
              {state.error}
            </div>
          ) : null}
          <Button type="submit" size="lg" className="w-full" disabled={pending}>
            {pending ? "Sending…" : "Send reset link"}
          </Button>
        </form>
      )}
      <div className="mt-4 text-mono text-xs text-[var(--color-text-tertiary)]">
        <Link href="/login">Back to log in</Link>
      </div>
    </AuthCard>
  );
}
