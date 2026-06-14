"use client";

import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import type { State } from "./actions";

export function WhiteboardForm({
  action,
  submitLabel,
}: {
  action: (prev: State, fd: FormData) => Promise<State>;
  submitLabel: string;
}) {
  return (
    <FormShell action={action} cancelHref="/console/collaborate/whiteboards" submitLabel={submitLabel}>
      <Input
        label="Name"
        name="name"
        required
        maxLength={200}
        hint="e.g. Main Stage plot, FOH signal flow, Run-of-show."
      />
    </FormShell>
  );
}
