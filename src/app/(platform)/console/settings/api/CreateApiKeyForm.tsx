"use client";

import * as React from "react";
import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/Dialog";
import { useToast } from "@/lib/hooks/useToast";
import { createApiKeyAction, type CreateState } from "./actions";

export function CreateApiKeyForm() {
  const [state, formAction, pending] = useActionState<CreateState, FormData>(
    createApiKeyAction,
    null,
  );
  const [open, setOpen] = React.useState(false);
  const toast = useToast();

  // When the secret comes back, surface a copy-this-once panel.
  const secret = state && "secret" in state ? state.secret : undefined;

  function copy() {
    if (!secret) return;
    void navigator.clipboard.writeText(secret).then(() => {
      toast.success("Copied to clipboard");
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" size="sm">+ New key</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create API key</DialogTitle>
          <DialogDescription>
            We will show the secret exactly once — store it somewhere safe.
          </DialogDescription>
        </DialogHeader>
        {secret ? (
          <div className="space-y-3">
            <div className="rounded-md border border-[var(--border-color)] bg-[var(--surface-inset)] p-3">
              <code className="break-all font-mono text-xs">{secret}</code>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={copy}>Copy</Button>
              <Button type="button" onClick={() => setOpen(false)}>Done</Button>
            </div>
          </div>
        ) : (
          <form action={formAction} className="space-y-3">
            <Input label="Name" name="name" required maxLength={120} placeholder="e.g. CI bot" />
            <Input
              label="Scopes"
              name="scopes"
              hint="Comma-separated, e.g. projects:read, invoices:read"
            />
            {state && "error" in state && state.error && (
              <p className="text-xs text-[var(--color-error)]">{state.error}</p>
            )}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={pending}>
                Generate key
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
