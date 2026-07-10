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
import { Alert } from "@/components/ui/Alert";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/Dialog";
import { useAnnounce } from "@/components/ui/LiveRegion";
import { useT } from "@/lib/i18n/LocaleProvider";

/** Sentinel `blockedUrl` value: the guard intercepted a browser Back
 *  (popstate) rather than a link click. Not a routable path, so it can
 *  never collide with a real href. */
const BACK_NAVIGATION = "__back__";

export type FormState = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  /**
   * Submitted form values to echo back on validation failure. React server
   * actions reset uncontrolled inputs on submission completion, so without
   * this echo the user has to re-type everything on every error. Actions
   * populate this with `Object.fromEntries(fd)` (filtering out File entries)
   * on the failure path; FormShell walks the form on the next render and
   * patches the matching `name=` element's `.value`.
   */
  values?: Record<string, string>;
} | null;

type FormShellProps = {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  submitLabel?: string;
  cancelHref?: string;
  children: ReactNode;
  /** Unsaved-changes guard (FE-5). Defaults ON — the guard only arms once
   *  the form is actually dirty, so untouched forms never prompt. Pass
   *  `dirtyGuard={false}` to opt out (auth/login flows, throwaway forms). */
  dirtyGuard?: boolean;
  className?: string;
} & Omit<FormHTMLAttributes<HTMLFormElement>, "action">;

export function FormShell({
  action,
  submitLabel,
  cancelHref,
  children,
  dirtyGuard = true,
  className = "surface space-y-4 p-6",
  ...formProps
}: FormShellProps) {
  const t = useT();
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, null);
  const formRef = useRef<HTMLFormElement>(null);
  const errorId = useId();
  const announce = useAnnounce();
  const router = useRouter();
  const resolvedSubmitLabel = submitLabel ?? t("common.save", undefined, "Save");

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

  // popstate interception — browser Back would otherwise silently discard
  // edits (A-37). Once the form goes dirty we push a same-URL sentinel
  // entry; the first Back pops the sentinel (staying on this page), the
  // handler re-arms it and raises the leave dialog. "Leave anyway" then
  // walks back past both entries via history.go(-2).
  const backArmedRef = useRef(false);
  useEffect(() => {
    if (!dirtyGuard || !dirty || backArmedRef.current) return;
    backArmedRef.current = true;
    window.history.pushState(null, "", window.location.href);
  }, [dirtyGuard, dirty]);
  useEffect(() => {
    if (!dirtyGuard) return;
    function onPopState() {
      if (!dirtyRef.current || !backArmedRef.current) return;
      // Re-arm the sentinel so the page stays put while the dialog is up.
      window.history.pushState(null, "", window.location.href);
      setBlockedUrl(BACK_NAVIGATION);
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [dirtyGuard]);

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
    if (state?.ok) announce(t("common.savedToast", undefined, "Saved"), "polite");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, announce]);

  // Restore submitted values after a validation failure. React server-actions
  // reset uncontrolled inputs once the action settles; when the action returns
  // `{ error, values }` we walk the form and patch each named field's `.value`
  // back to what the user typed so they don't have to re-enter the form.
  useEffect(() => {
    if (!state?.values || !formRef.current) return;
    const form = formRef.current;
    for (const [name, value] of Object.entries(state.values)) {
      if (typeof value !== "string") continue;
      const el = form.elements.namedItem(name);
      if (!el) continue;
      // RadioNodeList for repeated names — skip; rare in our forms.
      if (el instanceof HTMLInputElement && (el.type === "checkbox" || el.type === "radio")) {
        el.checked = value === "on" || value === el.value;
      } else if (
        el instanceof HTMLInputElement ||
        el instanceof HTMLTextAreaElement ||
        el instanceof HTMLSelectElement
      ) {
        el.value = value;
      }
    }
  }, [state]);

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
          <div id={errorId}>
            <Alert kind="error">
              {state.error}
              {/* FE-1 — enumerate per-field errors beneath the summary so
                  forms built from raw `ps-input` elements (which don't read
                  FormErrorContext) still tell the user WHICH field failed. */}
              {state.fieldErrors && Object.keys(state.fieldErrors).length > 0 && (
                <ul className="mt-1.5 list-disc space-y-0.5 ps-4 text-xs">
                  {Object.entries(state.fieldErrors).map(([field, message]) => (
                    <li key={field}>
                      <span className="font-medium">{humanizeFieldName(field)}</span>: {message}
                    </li>
                  ))}
                </ul>
              )}
            </Alert>
          </div>
        )}
        <div className="flex items-center justify-end gap-2">
          {cancelHref && (
            <Button href={cancelHref} variant="ghost">
              {t("common.cancel", undefined, "Cancel")}
            </Button>
          )}
          <Button type="submit" loading={pending}>
            {pending ? t("common.saving", undefined, "Saving") : resolvedSubmitLabel}
          </Button>
        </div>
      </form>

      {/* Unsaved-changes confirmation dialog */}
      <Dialog open={blockedUrl !== null} onOpenChange={(v) => !v && setBlockedUrl(null)}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>{t("formShell.leavePrompt.title", undefined, "Leave without saving?")}</DialogTitle>
            <DialogDescription>
              {t(
                "formShell.leavePrompt.body",
                undefined,
                "You have unsaved changes. If you leave now, they will be lost.",
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setBlockedUrl(null)}>
              {t("formShell.leavePrompt.stay", undefined, "Stay on this page")}
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                const href = blockedUrl;
                setBlockedUrl(null);
                setDirty(false);
                if (href === BACK_NAVIGATION) {
                  // Walk back past the re-armed sentinel AND the original
                  // entry the user was trying to leave.
                  backArmedRef.current = false;
                  window.history.go(-2);
                } else if (href) {
                  // Use router for in-app; fall back to assign
                  if (href.startsWith("/")) router.push(href);
                  else window.location.assign(href);
                }
              }}
            >
              {t("formShell.leavePrompt.leave", undefined, "Leave anyway")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </FormErrorContext.Provider>
  );
}

/** "load_in_date" / "loadInDate" → "Load in date" — best-effort label for
 *  the error-banner field list when all we have is the input's name. */
function humanizeFieldName(name: string): string {
  const spaced = name
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .trim();
  return spaced ? spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase() : name;
}

// ────────────────────────────────────────────────────────────────────
// Field-error context — lets <FormField> read its error by name
// ────────────────────────────────────────────────────────────────────

const FormErrorContext = createContext<Record<string, string> | null>(null);

export function useFieldError(name: string): string | undefined {
  const ctx = useContext(FormErrorContext);
  return ctx?.[name];
}
