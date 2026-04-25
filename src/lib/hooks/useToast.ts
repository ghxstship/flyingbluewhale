"use client";

import { toast as sonnerToast } from "sonner";

/**
 * Canonical toast API. Wraps `sonner` so the rest of the codebase imports
 * from one place — swapping the underlying lib later is a one-file change.
 *
 * Usage:
 *   const toast = useToast();
 *   toast.success("Saved", { description: "Branding updated" });
 *   toast.error("Could not save", { description: e.message });
 *   toast.action("Deleted task", { action: { label: "Undo", onClick: undo } });
 */
type ToastOpts = {
  description?: string;
  duration?: number;
  action?: { label: string; onClick: () => void };
  dismissible?: boolean;
};

function fire(
  kind: "default" | "success" | "error" | "warning" | "info",
  message: string,
  opts?: ToastOpts,
) {
  const fn =
    kind === "success"
      ? sonnerToast.success
      : kind === "error"
        ? sonnerToast.error
        : kind === "warning"
          ? sonnerToast.warning
          : kind === "info"
            ? sonnerToast.info
            : sonnerToast;
  return fn(message, {
    description: opts?.description,
    duration: opts?.duration,
    action: opts?.action,
    dismissible: opts?.dismissible ?? true,
  });
}

export function useToast() {
  return {
    success: (message: string, opts?: ToastOpts) => fire("success", message, opts),
    error: (message: string, opts?: ToastOpts) => fire("error", message, opts),
    warning: (message: string, opts?: ToastOpts) => fire("warning", message, opts),
    info: (message: string, opts?: ToastOpts) => fire("info", message, opts),
    message: (message: string, opts?: ToastOpts) => fire("default", message, opts),
    dismiss: (id?: string | number) => sonnerToast.dismiss(id),
    promise: <T,>(p: Promise<T>, msgs: { loading: string; success: string; error: string }) =>
      sonnerToast.promise(p, msgs),
  };
}

export type Toast = ReturnType<typeof useToast>;
