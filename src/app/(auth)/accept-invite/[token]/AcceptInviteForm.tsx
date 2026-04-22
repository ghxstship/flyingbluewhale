"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { acceptInviteAction } from "../../actions";
import type { FormState } from "@/components/FormShell";

export function AcceptInviteForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(acceptInviteAction, null);

  useEffect(() => {
    if (state?.error) toast.error(state.error);
  }, [state]);

  return (
    <AuthShell
      title="Join your team"
      subtitle="Accept your invitation to Second Star Technologies"
      footer={
        <Link href="/login" className="text-[var(--org-primary)] underline underline-offset-4">
          Sign in instead
        </Link>
      }
    >
      <p className="text-sm text-[var(--text-secondary)]">
        You&apos;ve been invited to a Second Star Technologies workspace. Accept below and we&apos;ll
        take you straight in.
      </p>
      {state?.error && (
        <Alert kind="error" className="mt-4">{state.error}</Alert>
      )}
      <form action={formAction} className="mt-6">
        <input type="hidden" name="token" value={token} />
        <Button type="submit" size="lg" className="w-full" loading={pending}>
          {pending ? "Joining…" : "Accept invite"}
        </Button>
      </form>
    </AuthShell>
  );
}
