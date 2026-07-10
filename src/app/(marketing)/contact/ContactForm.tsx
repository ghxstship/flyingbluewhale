"use client";

import { useActionState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { useT } from "@/lib/i18n/LocaleProvider";
import { submitContactAction, type ContactState } from "./actions";

export function ContactForm({
  topic,
  persona,
  plan,
  initialMessage,
}: {
  topic?: string;
  persona?: string;
  plan?: string;
  initialMessage?: string;
}) {
  const t = useT();
  const [state, formAction, pending] = useActionState<ContactState, FormData>(submitContactAction, null);

  if (state?.ok) {
    return (
      <div className="surface mt-8 p-8 text-center" role="status">
        <CheckCircle2 size={28} className="mx-auto text-[var(--p-success)]" aria-hidden="true" />
        <h3 className="mt-3 text-lg font-semibold">
          {t("marketing.pages.contact.form.successTitle", undefined, "Got it. We'll be in touch.")}
        </h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-[var(--p-text-2)]">
          {t(
            "marketing.pages.contact.form.successBody",
            undefined,
            "Your message is with the studio. A real person replies within one business day, usually sooner.",
          )}
        </p>
        <div className="mt-6">
          <Button href="/signup" variant="secondary">
            {t("marketing.pages.contact.form.actions.signupInstead", undefined, "Start free instead")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="surface mt-8 space-y-4 p-6">
      {topic && <input type="hidden" name="topic" value={topic} />}
      {(persona || plan) && (
        <input type="hidden" name="persona" value={[persona, plan && `plan:${plan}`].filter(Boolean).join(" · ")} />
      )}
      {/* Honeypot — hidden from humans, filled by naive bots. */}
      <div className="hidden" aria-hidden="true">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-xs font-medium text-[var(--p-text-2)]">
          {t("marketing.pages.contact.form.fields.name")}
          <input name="name" required className="ps-input mt-1.5 w-full" />
        </label>
        <label className="text-xs font-medium text-[var(--p-text-2)]">
          {t("marketing.pages.contact.form.fields.email")}
          <input name="email" type="email" required className="ps-input mt-1.5 w-full" />
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-xs font-medium text-[var(--p-text-2)]">
          {t("marketing.pages.contact.form.fields.company")}
          <input name="company" className="ps-input mt-1.5 w-full" />
        </label>
        <label className="text-xs font-medium text-[var(--p-text-2)]">
          {t("marketing.pages.contact.form.fields.scale")}
          <select name="scale" className="ps-input mt-1.5 w-full">
            <option>1–5</option>
            <option>6–20</option>
            <option>21–50</option>
            <option>50+</option>
          </select>
        </label>
      </div>
      <label className="block text-xs font-medium text-[var(--p-text-2)]">
        {t("marketing.pages.contact.form.fields.vertical")}
        <select name="vertical" className="ps-input mt-1.5 w-full">
          <option>{t("marketing.pages.contact.form.verticals.liveEvents")}</option>
          <option>{t("marketing.pages.contact.form.verticals.touring")}</option>
          <option>{t("marketing.pages.contact.form.verticals.corporate")}</option>
          <option>{t("marketing.pages.contact.form.verticals.fabrication")}</option>
          <option>{t("marketing.pages.contact.form.verticals.other")}</option>
        </select>
      </label>
      <label className="block text-xs font-medium text-[var(--p-text-2)]">
        {t("marketing.pages.contact.form.fields.message")}
        <textarea name="message" rows={4} className="ps-input mt-1.5 w-full" defaultValue={initialMessage} />
      </label>
      <label className="flex items-center gap-2 text-xs text-[var(--p-text-2)]">
        <input type="checkbox" name="demo" defaultChecked={topic === "walkthrough"} />{" "}
        {t("marketing.pages.contact.form.fields.demoOptIn")}
      </label>
      {state?.error && <Alert kind="error">{state.error}</Alert>}
      <div className="flex items-center justify-end gap-2">
        <Button href="/signup" variant="secondary">
          {t("marketing.pages.contact.form.actions.signupInstead")}
        </Button>
        <Button type="submit" loading={pending}>
          {pending
            ? t("marketing.pages.contact.form.actions.submitting", undefined, "Sending…")
            : t("marketing.pages.contact.form.actions.submit")}
        </Button>
      </div>
    </form>
  );
}
