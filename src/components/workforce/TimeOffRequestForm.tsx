"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestTimeOff, type State } from "./time-off-action";

import { useActionErrorResolver } from "@/lib/errors-client";
/**
 * Portal-native "Request time off" form (ADR-0008 Amendment 4).
 *
 * The portal used to send this to `/m/time-off/new`, which meant the read
 * was on desktop and the write was in a PWA — the exact friction the ADR set
 * out to remove — and for vendors it pointed at an app they cannot open.
 *
 * Not the kit `FormScreen` the mobile page uses: that's COMPVSS chrome, and
 * per ADR-0008 migration rule 3 each shell wraps shared data in its own
 * chrome. The action underneath is the same one, so the policy resolution and
 * manager notify can't drift between shells.
 *
 * Field ids (`from`/`to`/`type`/`notes`) match the kit form's ids because the
 * shared action's schema is written against them.
 */

const TYPES = ["Vacation", "Sick", "Personal", "Unpaid"];

export function TimeOffRequestForm({ revalidate, backHref }: { revalidate: string; backHref: string }) {
  const [state, formAction, pending] = useActionState<State, FormData>(requestTimeOff, null);
  const resolveErr = useActionErrorResolver();

  return (
    <form action={formAction}>
      <input type="hidden" name="revalidate" value={revalidate} />
      {/* Land back on the list. The mobile page navigates itself from a
          transition, so `redirectTo` is opt-in rather than baked into the
          action. */}
      <input type="hidden" name="redirectTo" value={backHref} />

      {state?.error && (
        <div className="ps-alert ps-alert--danger mb-4" role="alert">
          {resolveErr(state.error)}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="fld">
          <label className="lbl" htmlFor="from">
            Start date
          </label>
          <input id="from" name="from" type="date" className="ps-input" required />
          {state?.fieldErrors?.from && <div className="fld-err">{state.fieldErrors.from}</div>}
        </div>

        <div className="fld">
          <label className="lbl" htmlFor="to">
            End date
          </label>
          <input id="to" name="to" type="date" className="ps-input" required />
          {state?.fieldErrors?.to && <div className="fld-err">{state.fieldErrors.to}</div>}
        </div>
      </div>

      <div className="fld mt-4">
        <label className="lbl" htmlFor="type">
          Type
        </label>
        <select id="type" name="type" className="ps-input" defaultValue="Vacation">
          {TYPES.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
        {state?.fieldErrors?.type && <div className="fld-err">{state.fieldErrors.type}</div>}
      </div>

      <div className="fld mt-4">
        <label className="lbl" htmlFor="notes">
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          className="ps-input"
          rows={3}
          placeholder="Anything your manager should know"
        />
        {state?.fieldErrors?.notes && <div className="fld-err">{state.fieldErrors.notes}</div>}
      </div>

      <p className="mt-2 text-xs text-[var(--p-text-2)]">
        Requested time is counted as 8 hours per day. Your manager is notified as soon as you send this.
      </p>

      <div className="mt-6 flex gap-2">
        <Link href={backHref} className="ps-btn ps-btn--tertiary">
          Cancel
        </Link>
        <button type="submit" className="ps-btn ps-btn--cta" disabled={pending}>
          {pending ? "Sending…" : "Send request"}
        </button>
      </div>
    </form>
  );
}
