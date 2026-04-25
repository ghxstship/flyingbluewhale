"use client";

import * as React from "react";
import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/Dialog";
import { createCustomRole, type State } from "./actions";

export function CustomRoleForm() {
  const [state, action, pending] = useActionState<State, FormData>(createCustomRole, null);
  const [open, setOpen] = React.useState(false);
  React.useEffect(() => { if (state === null) setOpen(false); }, [state]);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" size="sm">+ New role</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New custom role</DialogTitle>
        </DialogHeader>
        <form action={action} className="space-y-3">
          <Input
            label="Slug"
            name="slug"
            required
            maxLength={60}
            placeholder="finance-reader"
            hint="Lowercase, dashes ok. Used in API tokens."
          />
          <Input label="Label" name="label" required maxLength={120} placeholder="Finance Reader" />
          <Input label="Description" name="description" maxLength={400} />
          <Input
            label="Permissions"
            name="permissions"
            hint="Comma-separated, e.g. invoices:read, expenses:read"
          />
          {state?.error && <p className="text-xs text-[var(--color-error)]">{state.error}</p>}
          <div className="flex justify-end">
            <Button type="submit" loading={pending}>Create role</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
