"use client";

import {
  createContext,
  useActionState,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
  type FormHTMLAttributes,
} from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/Dialog";
import { useAnnounce } from "@/components/ui/LiveRegion";

export type FormState = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
} | null;

type FormShellProps = {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  submitLabel?: string;
  cancelHref?: string;
  children: ReactNode;
  dirtyGuard?: boolean;
  className?: string;
} & Omit<FormHTMLAttributes<HTMLFormElement>, "action">;

export function FormShell({
  action,
  submitLabel = "Save",
  cancelHref,
  children,
  dirtyGuard,
  className = "surface-raised space-y-4 p-6",
  ...formProps
}: FormShellProps) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, null);
  const formRef = useRef<HTMLFormElement>(null);
  const errorId = useId();
  const announce = useAnnounce();
  const router = useRouter();

  const [dirty, setDirty] = useState(false);
  const dirtyRef = useRef(false);
  useEffect(() => {
    dirtyRef.current = dirty;
  }, [dirty]);

  const [blockedUrl, setBlockedUrl] = useState<string | null>(null);

  // beforeunload for full-page refreshes / tab close
  useEffect(() => {
    if (!dirtyGuard || !dirty || pending) return;
    function onBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirtyGuard, dirty, pending]);

  // Internal link click interceptor — catches next/link + <a> clicks when dirty
  useEffect(() => {
    if (!dirtyGuard) return;
    function onClick(e: MouseEvent) {
      if (!dirtyRef.current || pending) return;
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const anchor = target.closest("a") as HTMLAnchorElement | null;
      if (!anchor) return;
      // Only intercept same-origin, left-click, no modifier
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (anchor.target && anchor.target !== "_self") return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
      if (anchor.hostname && anchor.hostname !== window.location.hostname) return;
      e.preventDefault();
      setBlockedUrl(href);
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [dirtyGuard, pending]);

  // Announce error/success
  useEffect(() => {
    if (state?.error) announce(state.error, "assertive");
    if (state?.ok) announce("Saved", "polite");
  }, [state, announce]);

  const handleChange = useCallback(() => {
    if (!dirty) setDirty(true);
  }, [dirty]);

  return (
    <FormErrorContext.Provider value={state?.fieldErrors ?? null}>
      <form
        {...formProps}
        ref={formRef}
        action={async (fd) => {
          const result = await formAction(fd);
          if (result === undefined) setDirty(false);
        }}
        onChange={handleChange}
        onInput={handleChange}
        onSubmit={() => setDirty(false)}
        className={className}
        aria-busy={pending || undefined}
      >
        {children}
        {state?.error && (
          <div
            id={errorId}
            role="alert"
            className="rounded-lg border border-[var(--color-error)]/40 bg-[var(--color-error)]/10 p-2 text-xs text-[var(--color-error)]"
          >
            {state.error}
          </div>
        )}
        <div className="flex items-center justify-end gap-2">
          {cancelHref && (
            <Button href={cancelHref} variant="ghost">
              Cancel
            </Button>
          )}
          <Button type="submit" loading={pending}>
            {pending ? "Saving" : submitLabel}
          </Button>
        </div>
      </form>

      {/* Unsaved-changes confirmation dialog */}
      <Dialog open={blockedUrl !== null} onOpenChange={(v) => !v && setBlockedUrl(null)}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>Leave without saving?</DialogTitle>
            <DialogDescription>
              You have unsaved changes. If you leave now, they will be lost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setBlockedUrl(null)}>
              Stay on this page
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                const href = blockedUrl;
                setBlockedUrl(null);
                setDirty(false);
                if (href) {
                  // Use router for in-app; fall back to assign
                  if (href.startsWith("/")) router.push(href);
                  else window.location.assign(href);
                }
              }}
            >
              Leave anyway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </FormErrorContext.Provider>
  );
}

// ────────────────────────────────────────────────────────────────────
// Field-error context — lets <FormField> read its error by name
// ────────────────────────────────────────────────────────────────────

const FormErrorContext = createContext<Record<string, string> | null>(null);

export function useFieldError(name: string): string | undefined {
  const ctx = useContext(FormErrorContext);
  return ctx?.[name];
}
