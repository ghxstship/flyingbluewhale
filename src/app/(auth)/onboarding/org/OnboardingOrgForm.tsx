"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { createOrgAction } from "./actions";
import type { FormState } from "@/components/FormShell";

export function OnboardingOrgForm({ initialName = "", email }: { initialName?: string; email: string }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(createOrgAction, null);

  useEffect(() => {
    if (state?.error && !state?.fieldErrors) toast.error(state.error);
  }, [state]);

  return (
    <AuthShell
      title="Name Your Workspace"
      subtitle={`Signed in as ${email}. Just one more step — pick a workspace name and you're in.`}
    >
      <form action={formAction} className="space-y-4" noValidate>
        <Input
          label="Workspace Name"
          name="name"
          required
          autoFocus
          defaultValue={initialName}
          placeholder="Acme Productions"
          autoComplete="organization"
          hint="You can rename this later from Settings."
          error={state?.fieldErrors?.name}
        />
        {state?.error && !state?.fieldErrors && <Alert kind="error">{state.error}</Alert>}
        <Button type="submit" size="lg" className="w-full" loading={pending}>
          {pending ? "Creating workspace" : "Create workspace"}
        </Button>
        <p className="text-[11px] leading-relaxed text-[var(--text-muted)]">
          You&apos;ll become the owner. You can invite teammates from <code>/console/people/invites</code> once
          you&apos;re in.
        </p>
      </form>
    </AuthShell>
  );
}
