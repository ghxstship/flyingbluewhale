"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./Dialog";
import { Button } from "./Button";
import { useT } from "@/lib/i18n/LocaleProvider";

/**
 * Confirmation dialog built on the Radix-backed ./Dialog primitive — inherits
 * its focus trap, ESC-to-close, scroll lock, and reduced-motion handling.
 *
 * `tone="danger"` paints the confirm action with the danger button variant.
 * For one-off imperative confirms, mount <ConfirmDialogHost> once near the root
 * and call the promise-returning helper from `useConfirm()`.
 */

export type ConfirmTone = "default" | "danger";

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
  /** Called when the user confirms. May be async; the confirm button shows a spinner. */
  onConfirm: () => void | Promise<void>;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel,
  tone = "default",
  onConfirm,
}: ConfirmDialogProps) {
  const t = useT();
  const [busy, setBusy] = React.useState(false);

  const handleConfirm = React.useCallback(async () => {
    try {
      setBusy(true);
      await onConfirm();
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  }, [onConfirm, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={(o) => (busy ? undefined : onOpenChange(o))}>
      <DialogContent size="sm" role="alertdialog">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>
            {cancelLabel ?? t("ui.confirm.cancel", undefined, "Cancel")}
          </Button>
          <Button variant={tone === "danger" ? "danger" : "primary"} onClick={handleConfirm} loading={busy}>
            {confirmLabel ?? t("ui.confirm.confirm", undefined, "Confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Imperative helper ──────────────────────────────────────────────────────

export interface ConfirmRequest {
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
}

type Resolver = (ok: boolean) => void;

interface ConfirmHostHandle {
  request: (req: ConfirmRequest) => Promise<boolean>;
}

const ConfirmHostContext = React.createContext<ConfirmHostHandle | null>(null);

/**
 * Returns a function that opens the host confirm dialog and resolves to
 * `true`/`false`. Requires <ConfirmDialogHost> mounted above. Clean call site:
 *
 *   const confirm = useConfirm();
 *   if (await confirm({ title: "Delete?", tone: "danger" })) remove();
 */
export function useConfirm(): (req: ConfirmRequest) => Promise<boolean> {
  const host = React.useContext(ConfirmHostContext);
  if (!host) throw new Error("useConfirm must be used within a <ConfirmDialogHost>");
  return host.request;
}

export function ConfirmDialogHost({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<{ open: boolean; req: ConfirmRequest | null }>({
    open: false,
    req: null,
  });
  const resolver = React.useRef<Resolver | null>(null);

  const request = React.useCallback((req: ConfirmRequest) => {
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
      setState({ open: true, req });
    });
  }, []);

  const settle = React.useCallback((ok: boolean) => {
    resolver.current?.(ok);
    resolver.current = null;
  }, []);

  const handle = React.useMemo<ConfirmHostHandle>(() => ({ request }), [request]);

  return (
    <ConfirmHostContext.Provider value={handle}>
      {children}
      {state.req && (
        <ConfirmDialog
          open={state.open}
          onOpenChange={(o) => {
            if (!o) {
              settle(false);
              setState((s) => ({ ...s, open: false }));
            }
          }}
          title={state.req.title}
          description={state.req.description}
          confirmLabel={state.req.confirmLabel}
          cancelLabel={state.req.cancelLabel}
          tone={state.req.tone}
          onConfirm={() => {
            settle(true);
            setState((s) => ({ ...s, open: false }));
          }}
        />
      )}
    </ConfirmHostContext.Provider>
  );
}
