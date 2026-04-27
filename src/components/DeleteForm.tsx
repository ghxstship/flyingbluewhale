"use client";

import { useTransition, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";

type DeleteFormProps = {
  /** Server action bound to the resource id. */
  action: () => Promise<void>;
  /** Confirmation prompt shown via window.confirm. */
  confirm: string;
  /** Optional label override; defaults to "Delete". */
  label?: ReactNode;
  /** Button size; defaults to "sm". */
  size?: "sm" | "md" | "lg";
};

/**
 * Delete button + form pair with a window.confirm() guard.
 *
 * Submits a no-arg server action when the user confirms. The action is
 * expected to redirect away after deletion (e.g. revalidatePath then
 * redirect to the list page) — we don't render success state here.
 */
export function DeleteForm({ action, confirm, label = "Delete", size = "sm" }: DeleteFormProps) {
  const [pending, startTransition] = useTransition();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!window.confirm(confirm)) return;
        startTransition(() => {
          void action();
        });
      }}
    >
      <Button type="submit" variant="danger" size={size} loading={pending}>
        {pending ? "Deleting" : label}
      </Button>
    </form>
  );
}
