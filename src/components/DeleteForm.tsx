"use client";

import { Button } from "@/components/ui/Button";

export function DeleteForm({
  action,
  label = "Delete",
  confirm: confirmMessage = "Delete this record? This cannot be undone.",
}: {
  action: () => void | Promise<void>;
  label?: string;
  confirm?: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(confirmMessage)) e.preventDefault();
      }}
    >
      <Button type="submit" variant="danger" size="sm">
        {label}
      </Button>
    </form>
  );
}
