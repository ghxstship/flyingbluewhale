"use client";

import { FormShell, type FormState } from "@/components/FormShell";
import { FormField, TextInput } from "@/components/forms/FormField";
import { useT } from "@/lib/i18n/LocaleProvider";
import { unlockMsa } from "./actions";

export function UnlockForm({
  token,
  expired = false,
  orgName,
  supportEmail,
}: {
  token: string;
  expired?: boolean;
  /** E-05: derived from the MSA's org row — never hardcode a client name. */
  orgName?: string | null;
  supportEmail?: string | null;
}) {
  const t = useT();
  const action = async (prev: FormState, fd: FormData) => {
    return (await unlockMsa(token, prev as never, fd)) as FormState;
  };

  return (
    <div className="mx-auto max-w-md space-y-6 py-12">
      <div className="space-y-2 text-center">
        {orgName && (
          <div className="font-mono text-xs tracking-widest text-[var(--p-text-2)] uppercase">{orgName}</div>
        )}
        <h1 className="text-2xl font-semibold">{t("legal.msaUnlock.title", undefined, "Master Services Agreement")}</h1>
        <p className="text-sm text-[var(--p-text-2)]">
          {expired
            ? t(
                "legal.msaUnlock.expiredHint",
                undefined,
                "Your session expired or the access code changed. Re-enter the 6-character access code that was sent with this link.",
              )
            : t(
                "legal.msaUnlock.hint",
                undefined,
                "Enter the 6-character access code that was sent with this link to view your MSA.",
              )}
        </p>
      </div>

      <FormShell
        action={action}
        submitLabel={t("legal.msaUnlock.openMsa", undefined, "Open MSA")}
        className="surface space-y-4 p-6"
      >
        <FormField name="access_code" label={t("legal.msaUnlock.accessCodeLabel", undefined, "Access Code")} required>
          <TextInput
            name="access_code"
            autoComplete="off"
            autoFocus
            inputMode="text"
            maxLength={6}
            placeholder="ABC123"
            className="ps-input focus-ring text-center font-mono text-2xl tracking-[0.4em] uppercase"
          />
        </FormField>
        {supportEmail && (
          <p className="text-center text-xs text-[var(--p-text-2)]">
            {t("legal.msaUnlock.troubleContact", undefined, "Trouble? Contact")}{" "}
            <a className="underline" href={`mailto:${supportEmail}`}>
              {supportEmail}
            </a>
          </p>
        )}
      </FormShell>
    </div>
  );
}
