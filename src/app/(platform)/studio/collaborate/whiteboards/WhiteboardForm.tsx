"use client";

import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { useT } from "@/lib/i18n/LocaleProvider";
import type { State } from "./actions";

export function WhiteboardForm({
  action,
  submitLabel,
}: {
  action: (prev: State, fd: FormData) => Promise<State>;
  submitLabel: string;
}) {
  const t = useT();
  return (
    <FormShell action={action} cancelHref="/studio/collaborate/whiteboards" submitLabel={submitLabel}>
      <Input
        label={t("console.collaborate.whiteboards.form.fields.name", undefined, "Name")}
        name="name"
        required
        maxLength={200}
        hint={t(
          "console.collaborate.whiteboards.form.hints.name",
          undefined,
          "e.g. Main Stage plot, FOH signal flow, Run-of-show.",
        )}
      />
    </FormShell>
  );
}
