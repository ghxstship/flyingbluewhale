"use client";

import { useState, useTransition } from "react";
import { toast } from "@/lib/hooks/useToast";
import type { NotifKind, NotifKindRow } from "./kinds";
import { toggleNotifKindPref } from "./actions";

export type NotifPrefsLabels = {
  eventColumn: string;
  pushColumn: string;
  inAppColumn: string;
  inAppAlwaysOn: string;
  /** aria-label template with `{event}` and `{channel}` placeholders — a
   *  string (not a function) so the server page can pass it as a prop. */
  viaTemplate: string;
};

const fillVia = (template: string, event: string, channel: string) =>
  template.replaceAll("{event}", event).replaceAll("{channel}", channel);

/**
 * The honest notification-preferences matrix, shared by /me/notifications and
 * /p/[slug]/settings/notifications. Rows are the `notification_kind_catalog`
 * taxonomy; the only writable channel is Push because that is the only
 * channel the delivery gate (`filterByPushPrefs` in src/lib/push/send.ts)
 * actually reads. The in-app inbox column renders as always-on — bell rows
 * are written unconditionally — so users see exactly what each switch does.
 * Email/Slack columns were dropped: nothing delivers on them today.
 *
 * Optimistic per-cell toggle with revert-on-error, mirroring the
 * /m/notifications NotifMatrix pattern.
 */
export function NotifPrefsMatrix({
  kinds,
  initial,
  labels,
}: {
  kinds: NotifKindRow[];
  initial: Record<NotifKind, boolean>;
  labels: NotifPrefsLabels;
}) {
  const [state, setState] = useState<Record<string, boolean>>(initial);
  const [, startTransition] = useTransition();

  const flip = (kind: NotifKind, label: string) => {
    const next = !state[kind];
    setState((s) => ({ ...s, [kind]: next }));
    startTransition(async () => {
      const fd = new FormData();
      fd.set("kind", kind);
      fd.set("on", next ? "1" : "0");
      const res = await toggleNotifKindPref(null, fd);
      if (res?.error) {
        setState((s) => ({ ...s, [kind]: !next }));
        toast.error(`${label}: ${res.error}`);
      }
    });
  };

  return (
    <div className="surface overflow-x-auto">
      <table className="ps-table">
        <thead>
          <tr>
            <th>{labels.eventColumn}</th>
            <th className="text-center">{labels.pushColumn}</th>
            <th className="text-center">{labels.inAppColumn}</th>
          </tr>
        </thead>
        <tbody>
          {kinds.map((row) => (
            <tr key={row.kind}>
              <td>
                <div className="text-sm font-medium">{row.label}</div>
                {row.description && <div className="mt-0.5 text-xs text-[var(--p-text-2)]">{row.description}</div>}
              </td>
              <td className="text-center">
                <input
                  type="checkbox"
                  checked={Boolean(state[row.kind])}
                  onChange={() => flip(row.kind, row.label)}
                  aria-label={fillVia(labels.viaTemplate, row.label, labels.pushColumn)}
                />
              </td>
              <td className="text-center">
                <input
                  type="checkbox"
                  checked
                  disabled
                  aria-label={fillVia(labels.viaTemplate, row.label, labels.inAppColumn)}
                  title={labels.inAppAlwaysOn}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
