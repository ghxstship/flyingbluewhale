"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/Button";
import { PasswordField } from "@/components/auth/PasswordField";
import { Alert } from "@/components/ui/Alert";
import { resetPasswordAction } from "../actions";
import type { FormState } from "@/components/FormShell";

export function ResetPasswordForm() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(resetPasswordAction, null);

  useEffect(() => {
    if (state?.error && !state?.fieldErrors) toast.error(state.error);
  }, [state]);

  return (
    <AuthShell
      title="Set a new password"
      subtitle="Choose a password you haven't used before."
      footer={
        <Link href="/login" className="text-[var(--org-primary)] underline underline-offset-4">
          Back to sign in
        </Link>
      }
    >
      <form action={formAction} className="space-y-4" noValidate>
        <PasswordField
          name="password"
          label="New password"
          required
          minLength={8}
          autoComplete="new-password"
          showStrength
          hint="At least 8 characters"
          error={state?.fieldErrors?.password}
        />
        <PasswordField
          name="password_confirm"
          label="Confirm password"
          required
          minLength={8}
          autoComplete="new-password"
          error={state?.fieldErrors?.password_confirm}
        />
        {state?.error && !state?.fieldErrors && (
          <Alert kind="error">{state.error}</Alert>
        )}
        <Button type="submit" size="lg" className="w-full" loading={pending}>
          {pending ? "Updating" : "Update password"}
        </Button>
      </form>
    </AuthShell>
  );
}
