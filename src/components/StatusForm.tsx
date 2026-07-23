"use client";

import { useTransition, useState } from "react";
import { Alert } from "@/components/ui/Alert";

import { useActionErrorResolver } from "@/lib/errors-client";
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
  const resolveErr = useActionErrorResolver();
  const [error, setError] = useState<string | null>(null);

  // Variant → .ps-btn vocabulary (control-vocabulary canon): default renders
  // the ghost outline, primary the filled accent base, danger keeps the
  // outline treatment with danger ink (the filled --danger escalation is
  // reserved for genuinely destructive primaries).
  const tone =
    variant === "danger"
      ? "ps-btn--ghost text-[var(--p-danger)]"
      : variant === "primary"
        ? ""
        : "ps-btn--ghost";

  return (
    <span className={`relative inline-block ${className}`}>
      <form
        action={(fd) => {
          setError(null);
          startTransition(async () => {
            try {
              const result = await action(fd);
              if (result && "error" in result && result.error) {
                setError(resolveErr(result.error));
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
          className={`ps-btn ps-btn--sm ${tone}`}
        >
          {pending ? (pendingLabel ?? `${label}…`) : label}
        </button>
      </form>
      {error && (
        <span className="absolute start-0 top-full z-10 mt-1 inline-block max-w-xs">
          <Alert kind="error">{error}</Alert>
        </span>
      )}
    </span>
  );
}
