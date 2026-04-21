"use client";

import Link from "next/link";
import { useActionState } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Input } from "@/components/ui/Input";
import { forgotPasswordAction } from "../actions";
import type { FormState } from "@/components/FormShell";

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(forgotPasswordAction, null);
  const sent = state !== null && !state?.error;

  return (
    <AuthShell
      title="Reset password"
      subtitle={sent ? "Check your inbox for the reset link." : "We'll email you a reset link."}
      footer={
        <Link href="/login" className="text-[var(--org-primary)] underline underline-offset-4">
          Back to sign in
        </Link>
      }
    >
      {sent ? (
        <div role="status" aria-live="polite" className="surface-raised p-4 text-sm text-[var(--text-secondary)]">
          If an account exists for that email, the reset link is on its way. The link expires in 60 minutes.
        </div>
      ) : (
        <form action={formAction} className="space-y-4" noValidate>
          <Input label="Email" name="email" type="email" required autoComplete="email" />
          {state?.error && (
            <Alert kind="error">{state.error}</Alert>
          )}
          <Button type="submit" size="lg" className="w-full" loading={pending}>
            {pending ? "Sending" : "Send reset link"}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
