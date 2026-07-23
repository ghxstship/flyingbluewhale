"use client";

import * as React from "react";
import { useActionState } from "react";
import { Badge } from "@/components/ui/Badge";
import { useT } from "@/lib/i18n/LocaleProvider";
import { setAtomEnabledAction, setAtomOrgLabelAction, type State } from "./actions";

/**
 * Row controls for the XPMS Catalog pillar (LEG3ND P4): the org overlay's
 * enable/disable toggle and inline org-label editor. Rendered manager+ only —
 * members get the read-only cells from the server page. All writes go through
 * the org_xpms_atom_settings upsert actions; the catalog itself is immutable.
 */

export function AtomEnabledToggle({ atomId, enabled }: { atomId: string; enabled: boolean }) {
  const t = useT();
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const enabledLabel = t("console.legend.hub.xpms.enabled", undefined, "Enabled");
  const disabledLabel = t("console.legend.hub.xpms.disabled", undefined, "Disabled");
  return (
    <span className="inline-flex items-center gap-1.5">
      <button
        type="button"
        className="focus-ring cursor-pointer rounded-full disabled:opacity-60"
        disabled={pending}
        aria-pressed={enabled}
        aria-label={
          enabled
            ? t("console.legend.hub.xpms.disableAtom", undefined, "Disable this atom for your organization")
            : t("console.legend.hub.xpms.enableAtom", undefined, "Enable this atom for your organization")
        }
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const res = await setAtomEnabledAction(atomId, !enabled);
            if (res?.error) setError(res.error);
          });
        }}
      >
        <Badge variant={enabled ? "success" : "muted"}>
          {pending ? t("console.legend.hub.xpms.saving", undefined, "Saving…") : enabled ? enabledLabel : disabledLabel}
        </Badge>
      </button>
      {error ? <span className="text-[11px] text-[var(--p-danger-text)]">{error}</span> : null}
    </span>
  );
}

export function AtomLabelEditor({
  atomId,
  canonicalName,
  orgLabel,
}: {
  atomId: string;
  canonicalName: string;
  orgLabel: string | null;
}) {
  const t = useT();
  const [editing, setEditing] = React.useState(false);
  const action = React.useMemo(() => setAtomOrgLabelAction.bind(null, atomId), [atomId]);
  const [state, formAction, pending] = useActionState<State, FormData>(action, null);

  React.useEffect(() => {
    if (state?.ok) setEditing(false);
  }, [state]);

  if (!editing) {
    return (
      <span className="group inline-flex items-center gap-1.5">
        <span className="text-xs">{orgLabel ?? canonicalName}</span>
        {orgLabel ? (
          <span
            className="ps-id text-[11px] text-[var(--p-text-3)]"
            title={t("console.legend.hub.xpms.canonicalName", { name: canonicalName }, `Catalog name: ${canonicalName}`)}
          >
            {t("console.legend.hub.xpms.orgLabelMark", undefined, "org")}
          </span>
        ) : null}
        <button
          type="button"
          className="focus-ring cursor-pointer text-[11px] text-[var(--p-text-3)] underline-offset-2 hover:underline"
          onClick={() => setEditing(true)}
        >
          {t("console.legend.hub.xpms.edit", undefined, "Edit")}
        </button>
      </span>
    );
  }

  return (
    <form action={formAction} className="inline-flex items-center gap-1.5">
      <input
        type="text"
        name="org_label"
        defaultValue={orgLabel ?? ""}
        placeholder={canonicalName}
        maxLength={200}
        autoFocus
        className="ps-input ps-input--sm w-44"
        aria-label={t("console.legend.hub.xpms.orgLabelFor", { name: canonicalName }, `Org label for ${canonicalName}`)}
      />
      <button type="submit" className="ps-btn ps-btn--sm" disabled={pending}>
        {pending ? t("console.legend.hub.xpms.saving", undefined, "Saving…") : t("console.legend.hub.xpms.save", undefined, "Save")}
      </button>
      <button
        type="button"
        className="ps-btn ps-btn--sm ps-btn--secondary"
        onClick={() => setEditing(false)}
        disabled={pending}
      >
        {t("console.legend.hub.xpms.cancel", undefined, "Cancel")}
      </button>
      {state?.error ? <span className="text-[11px] text-[var(--p-danger-text)]">{state.error}</span> : null}
    </form>
  );
}
