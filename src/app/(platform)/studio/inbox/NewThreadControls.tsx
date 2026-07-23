"use client";

import * as React from "react";
import { useActionState } from "react";
import { createChannelAction, startDmAction, type State } from "./actions";

import { useActionErrorResolver } from "@/lib/errors-client";
export type NewThreadLabels = {
  newChannel: string;
  newDm: string;
  channelName: string;
  person: string;
  create: string;
  start: string;
};

/**
 * New Message / New Channel intakes (kit 20 Inbox M2) — native disclosure
 * popovers over the real chat stores; the DM form find-or-creates the
 * direct room server-side.
 */
export function NewThreadControls({
  people,
  labels,
}: {
  people: Array<{ id: string; label: string }>;
  labels: NewThreadLabels;
}) {
  const [dmState, dmAction, dmPending] = useActionState<State, FormData>(startDmAction, null);
  const resolveErr = useActionErrorResolver();
  const [chState, chAction, chPending] = useActionState<State, FormData>(createChannelAction, null);

  return (
    <div className="flex items-center gap-2">
      <details className="relative">
        <summary className="ps-btn ps-btn--sm cursor-pointer list-none">{labels.newDm}</summary>
        <form
          action={dmAction}
          className="absolute right-0 z-30 mt-2 w-64 space-y-2 rounded-[var(--p-r-md)] border border-[var(--p-border)] bg-[var(--p-surface)] p-3 shadow-[var(--p-elev-lg)]"
        >
          <label className="block text-xs font-medium" htmlFor="dm-user">
            {labels.person}
          </label>
          <select id="dm-user" name="userId" required className="ps-input ps-input--sm w-full">
            {people.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
          {dmState?.error ? (
            <p role="alert" className="text-xs text-[var(--p-danger-text)]">
              {resolveErr(dmState.error)}
            </p>
          ) : null}
          <button type="submit" className="ps-btn ps-btn--sm w-full" disabled={dmPending}>
            {labels.start}
          </button>
        </form>
      </details>
      <details className="relative">
        <summary className="ps-btn ps-btn--sm ps-btn--tertiary cursor-pointer list-none">{labels.newChannel}</summary>
        <form
          action={chAction}
          className="absolute right-0 z-30 mt-2 w-64 space-y-2 rounded-[var(--p-r-md)] border border-[var(--p-border)] bg-[var(--p-surface)] p-3 shadow-[var(--p-elev-lg)]"
        >
          <label className="block text-xs font-medium" htmlFor="channel-name">
            {labels.channelName}
          </label>
          <input id="channel-name" name="name" required maxLength={80} className="ps-input ps-input--sm w-full" />
          {chState?.error ? (
            <p role="alert" className="text-xs text-[var(--p-danger-text)]">
              {resolveErr(chState.error)}
            </p>
          ) : null}
          <button type="submit" className="ps-btn ps-btn--sm w-full" disabled={chPending}>
            {labels.create}
          </button>
        </form>
      </details>
    </div>
  );
}
