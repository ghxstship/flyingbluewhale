"use client";

import { FormShell, type FormState } from "@/components/FormShell";
import { FormField, TextInput } from "@/components/forms/FormField";
import { unlockOffer } from "./actions";
import { useT } from "@/lib/i18n/LocaleProvider";

export function UnlockForm({ token, expired = false }: { token: string; expired?: boolean }) {
  const t = useT();
  const action = async (prev: FormState, fd: FormData) => {
    return (await unlockOffer(token, prev as never, fd)) as FormState;
  };

  return (
    <div className="mx-auto max-w-md space-y-6 py-12">
      <div className="space-y-2 text-center">
        <div className="font-mono text-xs tracking-widest text-[var(--p-text-2)] uppercase">
          GHXSTSHIP × Five Senses Group
        </div>
        <h1 className="text-2xl font-semibold">{t("offer.unlock.title", undefined, "Engagement Letter")}</h1>
        <p className="text-sm text-[var(--p-text-2)]">
          {expired
            ? t(
                "offer.unlock.expiredBody",
                undefined,
                "Your session expired or the access code changed. Re-enter the 6-character access code that was sent with this link.",
              )
            : t(
                "offer.unlock.body",
                undefined,
                "Enter the 6-character access code that was sent with this link to view your offer letter.",
              )}
        </p>
      </div>

      <FormShell
        action={action}
        submitLabel={t("offer.unlock.submit", undefined, "Open Letter")}
        className="surface space-y-4 p-6"
      >
        <FormField name="access_code" label={t("offer.unlock.accessCode", undefined, "Access Code")} required>
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
        <p className="text-center text-xs text-[var(--p-text-2)]">
          {t("offer.unlock.troublePrefix", undefined, "Trouble? Contact")}{" "}
          <a className="underline" href="mailto:julian.clarkson@ghxstship.pro">
            julian.clarkson@ghxstship.pro
          </a>
        </p>
      </FormShell>
    </div>
  );
}
