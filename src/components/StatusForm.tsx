"use client";

import { useTransition, useState } from "react";
import { Alert } from "@/components/ui/Alert";

/**
 * Single-button form helper for status-change mutations on detail pages.
 *
 * The codebase has many one-shot mutations like "Pass inspection" / "Close
 * RFI" / "Approve PO" that were previously written as raw <form action={fn}>
 * with no pending state and no error surface. Wrapping them in StatusForm
 * gives:
 *   - pending state (button disabled + relabel during submit)
 *   - inline error toast (not a silent failure)
 *   - consistent surface + hover-lift styling
 *
 * Accepts the existing bound-action pattern so callers don't need to refactor
 * their server actions:
 *   <StatusForm action={transitionInspection.bind(null, id, "passed")} label="Pass" />
 *
 * The action MAY return either void (success → page re-renders via redirect/
 * revalidatePath) OR { error: string } (rendered inline below the button).
 */
type ActionResult = void | { error: string } | null | undefined;

export function StatusForm({
  action,
  label,
  pendingLabel,
  variant = "default",
  className = "",
}: {
  action: (fd: FormData) => Promise<ActionResult>;
  label: string;
  pendingLabel?: string;
  variant?: "default" | "danger" | "primary";
  className?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const tone =
    variant === "danger"
      ? "text-[var(--color-error)] hover:bg-[var(--color-error)]/5"
      : variant === "primary"
        ? "bg-[var(--org-primary)] text-[var(--org-on-primary)] hover:opacity-90"
        : "";

  return (
    <span className={`relative inline-block ${className}`}>
      <form
        action={(fd) => {
          setError(null);
          startTransition(async () => {
            try {
              const result = await action(fd);
              if (result && "error" in result && result.error) {
                setError(result.error);
              }
            } catch (e) {
              // Server action threw (e.g., a redirect counts as throw — those are intentional)
              const msg = (e as Error)?.message ?? "Something went wrong";
              if (!msg.includes("NEXT_REDIRECT")) setError(msg);
            }
          });
        }}
      >
        <button
          type="submit"
          disabled={pending}
          aria-busy={pending || undefined}
          className={`surface hover-lift rounded-md px-3 py-1.5 text-xs font-medium disabled:opacity-50 ${tone}`}
        >
          {pending ? (pendingLabel ?? `${label}…`) : label}
        </button>
      </form>
      {error && (
        <span className="absolute top-full left-0 z-10 mt-1 inline-block max-w-xs">
          <Alert kind="error">{error}</Alert>
        </span>
      )}
    </span>
  );
}
