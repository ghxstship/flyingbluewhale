"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { inviteTalentAction, type State } from "./actions";

export type InviteRow = {
  id: string;
  actName: string;
  claimed: boolean;
  genreLine: string | null;
};

/**
 * Checkbox roster + submit. Unclaimed profiles render disabled — there is
 * no account to notify; claiming the EPK is the path in.
 */
export function InviteForm({ postingId, rows, labels }: {
  postingId: string;
  rows: InviteRow[];
  labels: { submit: string; sent: string; unclaimed: string };
}) {
  const [state, formAction, pending] = useActionState<State, FormData>(inviteTalentAction, null);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="posting_id" value={postingId} />
      <div className="space-y-1">
        {rows.map((r) => (
          <label
            key={r.id}
            className={`surface flex items-center gap-3 p-3 ${r.claimed ? "cursor-pointer" : "opacity-55"}`}
          >
            <input
              type="checkbox"
              name="talent_ids"
              value={r.id}
              disabled={!r.claimed || pending}
              className="size-4 accent-[var(--p-accent)]"
            />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-[var(--p-text-1)]">{r.actName}</span>
              {r.genreLine ? (
                <span className="block truncate text-xs text-[var(--p-text-3)]">{r.genreLine}</span>
              ) : null}
            </span>
            {!r.claimed ? <span className="text-[11px] text-[var(--p-text-3)]">{labels.unclaimed}</span> : null}
          </label>
        ))}
      </div>
      {state?.error ? <p className="text-sm text-[var(--p-danger-text)]">{state.error}</p> : null}
      {state?.ok ? (
        <p className="text-sm text-[var(--p-success-text,var(--p-success))]">
          {labels.sent.replace("{count}", String(state.invited ?? 0))}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {labels.submit}
      </Button>
    </form>
  );
}
