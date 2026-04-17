"use client";

import { useActionState } from "react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";

type State = { error?: string; ok?: true } | null;

export function FormShell({
  action,
  submitLabel = "Save",
  cancelHref,
  children,
}: {
  action: (prev: State, fd: FormData) => Promise<State>;
  submitLabel?: string;
  cancelHref?: string;
  children: ReactNode;
}) {
  const [state, formAction, pending] = useActionState<State, FormData>(action, null);
  return (
    <form action={formAction} className="surface-raised space-y-4 p-6">
      {children}
      {state?.error && (
        <div className="rounded-lg border border-[var(--color-error)]/40 bg-[var(--color-error)]/10 p-2 text-xs text-[var(--color-error)]">
          {state.error}
        </div>
      )}
      <div className="flex items-center justify-end gap-2">
        {cancelHref && <Button href={cancelHref} variant="ghost">Cancel</Button>}
        <Button type="submit" disabled={pending}>{pending ? "Saving…" : submitLabel}</Button>
      </div>
    </form>
  );
}
