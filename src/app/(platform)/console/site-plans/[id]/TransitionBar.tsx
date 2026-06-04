"use client";

import { useActionState } from "react";
import type { SitePlanTransition } from "@/lib/siteplan/types";
import { useT } from "@/lib/i18n/LocaleProvider";
import { transitionSheet, type State } from "./actions";

type Props = {
  sheetId: string;
  transitions: SitePlanTransition[];
  labels: Record<SitePlanTransition, string>;
};

export function TransitionBar({ sheetId, transitions, labels }: Props) {
  const t = useT();
  if (transitions.length === 0) {
    return (
      <section className="surface-inset flex items-center justify-between p-3 text-xs">
        <span className="text-[var(--text-muted)]">
          {t("console.sitePlans.transitionBar.terminal", undefined, "Terminal state — no transitions available.")}
        </span>
      </section>
    );
  }
  return (
    <section className="surface-inset flex flex-wrap items-center gap-2 p-3">
      <span className="text-xs font-semibold tracking-wide text-[var(--text-muted)] uppercase">
        {t("console.sitePlans.transitionBar.lifecycle", undefined, "Lifecycle")}
      </span>
      {transitions.map((tr) => (
        <TransitionButton key={tr} sheetId={sheetId} transition={tr} label={labels[tr]} />
      ))}
    </section>
  );
}

function TransitionButton({
  sheetId,
  transition,
  label,
}: {
  sheetId: string;
  transition: SitePlanTransition;
  label: string;
}) {
  const [state, action, pending] = useActionState<State, FormData>(transitionSheet, null);
  const tone =
    transition === "issue"
      ? "border-[var(--color-success)] text-[var(--color-success)]"
      : transition === "approve"
        ? "border-[var(--color-info)] text-[var(--color-info)]"
        : transition === "reject" || transition === "supersede"
          ? "border-[var(--color-error)] text-[var(--color-error)]"
          : "border-[var(--border-color)]";
  return (
    <form action={action} className="contents">
      <input type="hidden" name="sheet_id" value={sheetId} />
      <input type="hidden" name="transition" value={transition} />
      <button
        type="submit"
        disabled={pending}
        className={`rounded-md border px-3 py-1.5 text-xs font-medium ${tone} disabled:opacity-60`}
      >
        {pending ? "…" : label}
      </button>
      {state?.error && (
        <span className="text-[11px] text-[var(--color-error)]" role="alert">
          {state.error}
        </span>
      )}
    </form>
  );
}
