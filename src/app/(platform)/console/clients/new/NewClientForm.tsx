"use client";

import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { useT } from "@/lib/i18n/LocaleProvider";
import { createClientAction } from "../actions";

export function NewClientForm() {
  const t = useT();
  return (
    <FormShell
      action={createClientAction}
      cancelHref="/console/clients"
      submitLabel={t("console.clients.new.submit", undefined, "Create Client")}
    >
      <Input label={t("console.clients.new.name", undefined, "Name")} name="name" required maxLength={120} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label={t("console.clients.new.email", undefined, "Email")} name="contact_email" type="email" />
        <Input label={t("console.clients.new.phone", undefined, "Phone")} name="contact_phone" />
      </div>
      <Input
        label={t("console.clients.new.website", undefined, "Website")}
        name="website"
        type="url"
        placeholder="https://"
      />
      <div>
        <label className="text-xs font-medium text-[var(--text-secondary)]">
          {t("console.clients.new.notes", undefined, "Notes")}
        </label>
        <textarea name="notes" rows={3} className="input-base mt-1.5 w-full" />
      </div>
    </FormShell>
  );
}
