"use client";

import { useActionState, useEffect, useId, useRef, useState, type ReactNode, type FormHTMLAttributes } from "react";
import { Button } from "@/components/ui/Button";
import { useAnnounce } from "@/components/ui/LiveRegion";

/**
 * State shape — backwards-compatible with v1 (`error`/`ok`),
 * plus optional `fieldErrors: Record<string, string>` for per-field rendering.
 */
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
  /** Block navigation if the form is dirty. */
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
  const [dirty, setDirty] = useState(false);

  // beforeunload guard
  useEffect(() => {
    if (!dirtyGuard || !dirty || pending) return;
    function onBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirtyGuard, dirty, pending]);

  // Announce error/success
  useEffect(() => {
    if (state?.error) announce(state.error, "assertive");
    if (state?.ok) announce("Saved", "polite");
  }, [state, announce]);

  // Mark dirty on input
  function handleChange() {
    if (!dirty) setDirty(true);
  }

  return (
    <FormErrorContext.Provider value={state?.fieldErrors ?? null}>
      <form
        {...formProps}
        ref={formRef}
        action={async (fd) => {
          const result = await formAction(fd);
          // useActionState returns void — the assignment is just for type completeness
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
    </FormErrorContext.Provider>
  );
}

// ────────────────────────────────────────────────────────────────────
// Field-error context — lets <FormField> read its error by name
// ────────────────────────────────────────────────────────────────────

import { createContext, useContext } from "react";

const FormErrorContext = createContext<Record<string, string> | null>(null);

export function useFieldError(name: string): string | undefined {
  const ctx = useContext(FormErrorContext);
  return ctx?.[name];
}
