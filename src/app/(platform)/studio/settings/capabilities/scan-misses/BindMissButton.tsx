"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import { bindGtinToCatalogItem, type BindGtinState } from "@/app/(mobile)/m/check-in/actions";

import { useActionErrorResolver } from "@/lib/errors-client";
/**
 * Bind a GTIN-shaped miss to a catalog item, right from the queue (kit 30).
 * Reuses the field surface's `bindGtinToCatalogItem` action — one write path
 * for the binding, whichever side of the console it comes from. The action
 * also resolves this miss row on success, so the row leaves the open queue.
 * Rendered only for rows whose code normalizes to a valid GTIN.
 */
export function BindMissButton({
  code,
  catalogItems,
}: {
  code: string;
  catalogItems: Array<{ id: string; label: string }>;
}) {
  const [state, formAction, pending] = useActionState<BindGtinState, FormData>(bindGtinToCatalogItem, null);
  const resolveErr = useActionErrorResolver();
  const [open, setOpen] = useState(false);

  if (state?.ok) {
    return (
      <span className="text-xs text-[var(--p-success-text)]" role="status">
        Bound
      </span>
    );
  }

  if (!open) {
    return (
      <Button type="button" size="sm" variant="tertiary" onClick={() => setOpen(true)}>
        Bind
      </Button>
    );
  }

  return (
    <form action={formAction} className="inline-flex items-center gap-2">
      <input type="hidden" name="code" value={code} />
      {state?.error && (
        <span className="text-xs text-[var(--p-danger-text)]" role="alert">
          {resolveErr(state.error)}
        </span>
      )}
      <select name="catalogItemId" className="ps-input ps-input--sm" defaultValue="" required>
        <option value="" disabled>
          Catalog item…
        </option>
        {catalogItems.map((i) => (
          <option key={i.id} value={i.id}>
            {i.label}
          </option>
        ))}
      </select>
      <Button type="submit" size="sm" variant="tertiary" disabled={pending}>
        {pending ? "Binding…" : "Bind"}
      </Button>
    </form>
  );
}
