"use client";

import * as React from "react";
import { useActionState } from "react";
import { Check } from "lucide-react";
import { addCloseTask, toggleCloseTask, type CloseState } from "./close-actions";

export type CloseItem = { id: string; title: string; done: boolean };

/**
 * Period Close checklist (kit 21 remediation R3, ADR-0015; FloQast). Renders
 * the close-kind tasks for the period with a toggle each + an add row. Locked
 * once the period is CLOSED/AUDITED (read-only).
 */
export function CloseChecklist({
  periodId,
  items,
  locked,
}: {
  periodId: string;
  items: CloseItem[];
  locked: boolean;
}) {
  const [state, formAction, pending] = useActionState<CloseState, FormData>(addCloseTask, null);
  const formRef = React.useRef<HTMLFormElement>(null);
  const done = items.filter((i) => i.done).length;

  return (
    <section className="surface space-y-3 p-6">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold tracking-wide uppercase">Close Checklist</h2>
        <span className="font-mono text-xs text-[var(--p-text-2)]">
          {done}/{items.length} done
        </span>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-[var(--p-text-2)]">Add the reconciliations, accruals, and reviews to close this period.</p>
      ) : (
        <ul className="space-y-1">
          {items.map((it) => (
            <li key={it.id} className="flex items-center gap-2">
              <button
                type="button"
                aria-label={it.done ? "Mark not done" : "Mark done"}
                disabled={locked}
                onClick={() => React.startTransition(() => void toggleCloseTask(it.id, periodId, !it.done))}
                className={`grid h-5 w-5 shrink-0 place-items-center rounded border ${
                  it.done
                    ? "border-[var(--p-accent)] bg-[var(--p-accent)] text-[var(--p-accent-contrast,white)]"
                    : "border-[var(--p-border)]"
                } ${locked ? "opacity-60" : ""}`}
              >
                {it.done && <Check size={12} />}
              </button>
              <span className={`text-sm ${it.done ? "text-[var(--p-text-3)] line-through" : ""}`}>{it.title}</span>
            </li>
          ))}
        </ul>
      )}

      {!locked && (
        <form
          ref={formRef}
          action={(fd) => {
            formAction(fd);
            formRef.current?.reset();
          }}
          className="flex items-center gap-2"
        >
          <input type="hidden" name="periodId" value={periodId} />
          <input
            name="title"
            required
            placeholder="Add a close task…"
            className="ps-input flex-1"
            aria-label="Close checklist item"
          />
          <button type="submit" className="ps-btn ps-btn--sm" disabled={pending}>
            Add
          </button>
        </form>
      )}
      {state?.error && (
        <p role="alert" className="text-xs text-[var(--p-danger-text)]">
          {state.error}
        </p>
      )}
    </section>
  );
}
