"use client";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { useT } from "@/lib/i18n/LocaleProvider";
import { createCrewAction } from "../actions";

export function NewCrewForm() {
  const t = useT();
  return (
    <FormShell
      action={createCrewAction}
      cancelHref="/studio/people/crew"
      submitLabel={t("console.people.crew.new.submit", undefined, "Add Crew")}
    >
      <Input label={t("console.people.crew.new.name", undefined, "Name")} name="name" required />
      <Input
        label={t("console.people.crew.new.role", undefined, "Role")}
        name="role"
        placeholder={t("console.people.crew.new.rolePlaceholder", undefined, "Gaffer, rigger, audio engineer…")}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label={t("console.people.crew.new.email", undefined, "Email")} name="email" type="email" />
        <Input label={t("console.people.crew.new.phone", undefined, "Phone")} name="phone" />
      </div>
      <Input
        label={t("console.people.crew.new.dayRate", undefined, "Day Rate (USD)")}
        name="day_rate"
        type="number"
        step="0.01"
      />
    </FormShell>
  );
}
