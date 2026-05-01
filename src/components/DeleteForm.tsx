"use client";

import { useState, useTransition, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";

type DeleteFormProps = {
  /** Server action bound to the resource id. */
  action: () => Promise<void>;
  /** Confirmation prompt shown in the dialog body. */
  confirm: string;
  /** Optional dialog title; defaults to "Confirm delete". */
  title?: string;
  /** Optional label override; defaults to "Delete". */
  label?: ReactNode;
  /** Button size; defaults to "sm". */
  size?: "sm" | "md" | "lg";
};

/**
 * Delete button + Radix Dialog confirmation.
 *
 * Replaced the previous native browser-confirm guard so we get a focus-trapped,
 * keyboard-navigable, screen-reader-friendly confirmation surface and the
 * design-system "no native prompts" rule passes. The action is expected to
 * redirect away after deletion (e.g. revalidatePath then redirect to the
 * list page) — we don't render success state here.
 */
export function DeleteForm({
  action,
  confirm,
  title = "Confirm delete",
  label = "Delete",
  size = "sm",
}: DeleteFormProps) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <>
      <Button type="button" variant="danger" size={size} onClick={() => setOpen(true)} loading={pending}>
        {pending ? "Deleting" : label}
      </Button>

      <Dialog open={open} onOpenChange={(o) => (!pending ? setOpen(o) : null)}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{confirm}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              loading={pending}
              onClick={() => {
                startTransition(() => {
                  void action();
                });
                setOpen(false);
              }}
            >
              {label}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
