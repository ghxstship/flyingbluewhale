"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { createOrgAction } from "./actions";
import type { FormState } from "@/components/FormShell";
import { useT } from "@/lib/i18n/LocaleProvider";

export function OnboardingOrgForm({ initialName = "", email }: { initialName?: string; email: string }) {
  const t = useT();
  const [state, formAction, pending] = useActionState<FormState, FormData>(createOrgAction, null);

  useEffect(() => {
    if (state?.error && !state?.fieldErrors) toast.error(state.error);
  }, [state]);

  return (
    <AuthShell
      title={t("auth.onboarding.title", undefined, "Name your world")}
      subtitle={t(
        "auth.onboarding.subtitle",
        { email },
        `Signed in as ${email}. One more step — name the workspace your productions live in.`,
      )}
    >
      <form action={formAction} className="space-y-4" noValidate>
        <Input
          label={t("auth.onboarding.workspaceName", undefined, "Workspace name")}
          name="name"
          required
          autoFocus
          defaultValue={initialName}
          placeholder={t("auth.onboarding.workspaceNamePlaceholder", undefined, "Acme Productions")}
          autoComplete="organization"
          hint={t("auth.onboarding.workspaceNameHint", undefined, "You can rename this later from Settings.")}
          error={state?.fieldErrors?.name}
        />
        {state?.error && !state?.fieldErrors && <Alert kind="error">{state.error}</Alert>}
        <Button type="submit" size="lg" className="w-full" loading={pending}>
          {pending
            ? t("auth.onboarding.submitting", undefined, "Creating workspace")
            : t("auth.onboarding.submit", undefined, "Create workspace")}
        </Button>
        {/* C8 — no leaked internal route in onboarding copy. */}
        <p className="text-[11px] leading-relaxed text-[var(--p-text-2)]">
          {t(
            "auth.onboarding.ownerNote",
            undefined,
            "You'll become the owner. You can invite teammates from your team settings once you're in.",
          )}
        </p>
      </form>
    </AuthShell>
  );
}
