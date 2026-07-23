"use client";

import { RecordActionButton as UiRecordActionButton } from "@/components/ui/RecordActionButton";

type ActionResult = { error?: string } | null | undefined | void;

/**
 * Compat wrapper (W5 vocabulary consolidation, F-02, 2026-07-22).
 *
 * The canonical record-action affordance is `@/components/ui/RecordActionButton`
 * (P0.4) — its modes are a superset (link mode, confirm dialog, success toast).
 * This file keeps the historical v7.8 "dumb trigger" API compiling for its
 * importers: pre-bound server action + label/pendingLabel, no success toast and
 * no refresh (a successful action redirects; reaching the post-await path
 * implies an error state — the ProposalConvertButton pattern). New code should
 * import from `@/components/ui/RecordActionButton` directly.
 */
export function RecordActionButton({
  action,
  label,
  pendingLabel,
  variant = "primary",
}: {
  action: () => Promise<ActionResult>;
  label: string;
  pendingLabel: string;
  variant?: "primary" | "secondary" | "ghost";
}) {
  return (
    <UiRecordActionButton
      action={async () => {
        const res = await action();
        return res ?? undefined;
      }}
      label={label}
      pendingLabel={pendingLabel}
      variant={variant}
      size="sm"
      successMessage={null}
      refreshOnSuccess={false}
    />
  );
}
