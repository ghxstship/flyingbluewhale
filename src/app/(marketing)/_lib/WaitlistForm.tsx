"use client";

import { useActionState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { useT } from "@/lib/i18n/LocaleProvider";
import { joinWaitlist, type WaitlistProduct, type WaitlistState } from "./waitlist-actions";

/**
 * Shared waitlist capture for the ATLVS / GVTEWAY coming-soon teasers.
 * Same useActionState shape as the contact form; the product is bound
 * into the server action so one action serves both pages.
 */
export function WaitlistForm({ product, productName }: { product: WaitlistProduct; productName: string }) {
  const t = useT();
  const [state, formAction, pending] = useActionState<WaitlistState, FormData>(
    joinWaitlist.bind(null, product),
    null,
  );

  if (state?.ok) {
    return (
      <div className="surface p-8 text-center" role="status" aria-live="polite">
        <CheckCircle2 size={28} className="mx-auto text-[var(--p-success)]" aria-hidden="true" />
        <h3 className="mt-3 text-lg font-semibold">
          {t("marketing.waitlist.successTitle", undefined, "You're on the list.")}
        </h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-[var(--p-text-2)]">
          {t(
            "marketing.waitlist.successBody",
            { product: productName },
            `We'll email you when ${productName} opens. No drip campaign, just the one note that matters.`,
          )}
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="surface space-y-4 p-6">
      {/* Honeypot — hidden from humans, filled by naive bots. */}
      <div className="hidden" aria-hidden="true">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-xs font-medium text-[var(--p-text-2)]">
          {t("marketing.waitlist.fields.email", undefined, "Work email")}
          <input name="email" type="email" required autoComplete="email" className="ps-input mt-1.5 w-full" />
        </label>
        <label className="text-xs font-medium text-[var(--p-text-2)]">
          {t("marketing.waitlist.fields.name", undefined, "Name (optional)")}
          <input name="name" autoComplete="name" className="ps-input mt-1.5 w-full" />
        </label>
      </div>
      <label className="block text-xs font-medium text-[var(--p-text-2)]">
        {t("marketing.waitlist.fields.company", undefined, "Company (optional)")}
        <input name="company" autoComplete="organization" className="ps-input mt-1.5 w-full" />
      </label>
      <div aria-live="polite">{state?.error && <Alert kind="error">{state.error}</Alert>}</div>
      <div className="flex items-center justify-end">
        <Button type="submit" loading={pending}>
          {pending
            ? t("marketing.waitlist.actions.submitting", undefined, "Adding you…")
            : t("marketing.waitlist.actions.submit", undefined, "Join the waitlist")}
        </Button>
      </div>
    </form>
  );
}
