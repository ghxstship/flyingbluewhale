"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { magicLinkAction } from "../actions";
import type { FormState } from "@/components/FormShell";

export function MagicLinkForm() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(magicLinkAction, null);

  useEffect(() => {
    if (state?.error && !state?.fieldErrors) toast.error(state.error);
  }, [state]);

  return (
    <AuthShell
      title="Email me a magic link"
      subtitle="We'll send a sign-in link to your inbox — no password required."
      footer={
        <Link href="/login" className="text-[var(--org-primary)] underline underline-offset-4">
          Back to sign in
        </Link>
      }
    >
      {state?.ok ? (
        <Alert kind="success">
          Check your inbox — we sent a sign-in link that expires in 1 hour.
        </Alert>
      ) : (
        <form action={formAction} className="space-y-4" noValidate>
          <Input
            label="Email"
            name="email"
            type="email"
            required
            autoComplete="email"
            error={state?.fieldErrors?.email}
          />
          {state?.error && !state?.fieldErrors && (
            <Alert kind="error">{state.error}</Alert>
          )}
          <Button type="submit" size="lg" className="w-full" loading={pending}>
            {pending ? "Sending" : "Send magic link"}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
