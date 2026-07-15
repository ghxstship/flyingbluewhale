"use client";

import { useActionState } from "react";
import Link from "next/link";
import { KIcon } from "@/components/mobile/kit";
import { logFieldMileage, type State } from "../actions";

/**
 * COMPVSS · Log A Drive.
 *
 * Four fields, filled in a cab with the engine running. No rate field —
 * the reimbursement rate is the column default and is not the driver's to
 * set; offering it would be an invitation to a dispute at best.
 *
 * Dated today by default because the honest moment to log a drive is the
 * moment it ends, and a date picker between the driver and that is how it
 * ends up logged never.
 */
export default function NewMileagePage() {
  const [state, formAction, pending] = useActionState<State, FormData>(logFieldMileage, null);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="screen screen-anim">
      <div className="scr-eye">Mileage</div>
      <h1 className="scr-h" style={{ marginBottom: 12 }}>
        Log A Drive
      </h1>

      {state?.error && (
        <div className="ps-alert ps-alert--danger" role="alert" style={{ marginBottom: 12 }}>
          {state.error}
        </div>
      )}

      <form action={formAction}>
        <div className="fld">
          <label htmlFor="origin">From</label>
          <input id="origin" name="origin" required maxLength={160} placeholder="e.g. Yard" />
          {state?.fieldErrors?.origin && <div className="hint">{state.fieldErrors.origin}</div>}
        </div>

        <div className="fld">
          <label htmlFor="destination">To</label>
          <input id="destination" name="destination" required maxLength={160} placeholder="e.g. Hialeah venue" />
          {state?.fieldErrors?.destination && <div className="hint">{state.fieldErrors.destination}</div>}
        </div>

        <div className="frow">
          <div className="fld" style={{ width: "100%" }}>
            <label htmlFor="miles">Miles</label>
            {/* decimal keypad — one hand, engine running. */}
            <input id="miles" name="miles" inputMode="decimal" required placeholder="12.4" />
            {state?.fieldErrors?.miles && <div className="hint">{state.fieldErrors.miles}</div>}
          </div>
          <div className="fld" style={{ width: "100%" }}>
            <label htmlFor="logged_on">Date</label>
            <input id="logged_on" name="logged_on" type="date" required defaultValue={today} />
          </div>
        </div>

        <div className="fld">
          <label htmlFor="notes">Notes</label>
          <textarea id="notes" name="notes" placeholder="Purpose of the trip…" />
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <Link
            href="/m/mileage"
            className="ps-btn ps-btn--tertiary ps-btn--lg"
            style={{ flex: 1, justifyContent: "center" }}
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="ps-btn ps-btn--cta ps-btn--lg"
            style={{ flex: 2, justifyContent: "center" }}
            disabled={pending}
          >
            <KIcon name="Truck" size={15} /> {pending ? "Saving…" : "Log Drive"}
          </button>
        </div>
      </form>
    </div>
  );
}
