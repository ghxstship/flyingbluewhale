"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button, type ButtonVariant, type ButtonSize } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";

/**
 * RecordActionButton (P0.4) — a declarative action affordance for record
 * detail pages. Two modes:
 *
 *  - **Link mode** (`href`): deep-links to a create/edit route, typically a
 *    prefilled `/new?party=…&catalog=…`. This is just `<Button href>`, exposed
 *    here for symmetry so a row of record actions reads uniformly.
 *  - **Action mode** (`action`): invokes a server action with a pending state,
 *    optional confirmation dialog, and success/error toast. The action may
 *    return `{ error }` (surfaced as an error toast) or `void`/throw.
 *
 * The point is composition: detail pages assemble a row of these for the
 * record's verbs ("Issue credential", "Add travel leg", "New assignment for
 * this person") instead of hand-rolling a button + transition + toast each
 * time. All authorization stays server-side in the action.
 */
type Common = {
  label: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  "aria-label"?: string;
};

type LinkMode = Common & { href: string; action?: never; confirm?: never; successMessage?: never };

type ActionMode = Common & {
  href?: never;
  action: () => Promise<{ error?: string } | void>;
  /** When set, show a confirmation dialog before running the action. */
  confirm?: { title?: string; body: string; confirmLabel?: string };
  /** Toast on success. Defaults to "Done". */
  successMessage?: string;
};

export function RecordActionButton(props: LinkMode | ActionMode) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  if ("href" in props && props.href) {
    return (
      <Button href={props.href} variant={props.variant ?? "secondary"} size={props.size ?? "sm"}>
        {props.label}
      </Button>
    );
  }

  const { action, confirm, successMessage } = props as ActionMode;

  const run = () => {
    startTransition(async () => {
      try {
        const res = await action();
        if (res && "error" in res && res.error) {
          toast.error(res.error);
          return;
        }
        toast.success(successMessage ?? "Done");
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Action failed");
      }
    });
  };

  return (
    <>
      <Button
        type="button"
        variant={props.variant ?? "secondary"}
        size={props.size ?? "sm"}
        loading={pending}
        aria-label={props["aria-label"]}
        onClick={() => (confirm ? setOpen(true) : run())}
      >
        {props.label}
      </Button>
      {confirm ? (
        <Dialog open={open} onOpenChange={(o) => (!pending ? setOpen(o) : null)}>
          <DialogContent size="sm">
            <DialogHeader>
              <DialogTitle>{confirm.title ?? "Confirm"}</DialogTitle>
              <DialogDescription>{confirm.body}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setOpen(false)} disabled={pending}>
                Cancel
              </Button>
              <Button
                type="button"
                variant={props.variant ?? "primary"}
                loading={pending}
                onClick={() => {
                  run();
                  setOpen(false);
                }}
              >
                {confirm.confirmLabel ?? "Confirm"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}
    </>
  );
}
