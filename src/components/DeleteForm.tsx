"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/hooks/useToast";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { restoreOrgScoped } from "@/app/(platform)/studio/actions/restore";
import { useT } from "@/lib/i18n/LocaleProvider";
import { useActionErrorResolver } from "@/lib/errors-client";

type DeleteFormProps = {
  /** Server action bound to the resource id. */
  action: () => Promise<void>;
  /** Confirmation prompt shown in the dialog body. */
  confirm: string;
  /** Optional dialog title; defaults to the localized "Confirm delete". */
  title?: string;
  /** Optional label override; defaults to the localized "Delete". */
  label?: ReactNode;
  /** Button size; defaults to "sm". */
  size?: "sm" | "md" | "lg";
  /**
   * REC-14 — optional soft-delete undo flow. When set, the bound `action`
   * is expected to soft-delete WITHOUT redirecting (return after
   * revalidatePath). DeleteForm then shows a "Deleted" toast carrying an
   * Undo action wired to `restoreOrgScoped(table, id)` and navigates to
   * `redirectTo` client-side. Adopters that omit `undo` keep the original
   * contract exactly: the action redirects and no toast is shown.
   */
  undo?: {
    /** Soft-deletable table name — validated server-side against SOFT_DELETABLE_TABLES. */
    table: string;
    /** Row id to clear `deleted_at` on when Undo is clicked. */
    id: string;
    /** Client-side destination after the delete; usually the list page. */
    redirectTo: string;
  };
};

/**
 * Delete button + Radix Dialog confirmation.
 *
 * Replaced the previous native browser-confirm guard so we get a focus-trapped,
 * keyboard-navigable, screen-reader-friendly confirmation surface and the
 * design-system "no native prompts" rule passes. Without `undo`, the action
 * is expected to redirect away after deletion (e.g. revalidatePath then
 * redirect to the list page) — we don't render success state here. With
 * `undo`, the action must NOT redirect; see the prop doc above.
 */
export function DeleteForm({ action, confirm, title, label, size = "sm", undo }: DeleteFormProps) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const resolveErr = useActionErrorResolver();

  const resolvedTitle = title ?? t("deleteForm.title", undefined, "Confirm delete");
  const resolvedLabel = label ?? t("deleteForm.delete", undefined, "Delete");

  const runDelete = () => {
    if (!undo) {
      // Legacy contract — the action revalidates + redirects server-side.
      startTransition(() => {
        void action();
      });
      return;
    }
    const { table, id, redirectTo } = undo;
    startTransition(async () => {
      await action();
      toast(t("deleteForm.deleted", undefined, "Deleted"), {
        action: {
          label: t("deleteForm.undo", undefined, "Undo"),
          onClick: () => {
            void restoreOrgScoped(table, id, redirectTo).then((res) => {
              if (res?.error) toast.error(resolveErr(res.error));
              else {
                toast.success(t("deleteForm.restored", undefined, "Restored"));
                router.refresh();
              }
            });
          },
        },
      });
      router.push(redirectTo);
    });
  };

  return (
    <>
      <Button type="button" variant="danger" size={size} onClick={() => setOpen(true)} loading={pending}>
        {pending ? t("deleteForm.deleting", undefined, "Deleting") : resolvedLabel}
      </Button>

      <Dialog open={open} onOpenChange={(o) => (!pending ? setOpen(o) : null)}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>{resolvedTitle}</DialogTitle>
            <DialogDescription>{confirm}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setOpen(false)} disabled={pending}>
              {t("common.cancel", undefined, "Cancel")}
            </Button>
            <Button
              type="button"
              variant="danger"
              loading={pending}
              onClick={() => {
                runDelete();
                setOpen(false);
              }}
            >
              {resolvedLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
