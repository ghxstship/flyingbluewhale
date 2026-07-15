"use client";

import { useActionState } from "react";
import Link from "next/link";
import { KIcon } from "@/components/mobile/kit";
import { createFieldRequisition, type State } from "../actions";

/**
 * COMPVSS · Request A Purchase.
 *
 * The scenario: a gel frame snaps at 18:00 and the replacement costs £40.
 * Until now the person holding the broken frame could not raise that — RLS
 * excluded the crew persona from `requisitions` entirely — so it travelled
 * by text message to someone with a laptop, or didn't travel at all.
 *
 * Four fields. Anything more is procurement's job, not the field's: no
 * vendor selection, no cost centre, no approval routing. Get the need
 * recorded before it's forgotten; the console does the rest.
 */
export default function NewRequisitionPage() {
  const [state, formAction, pending] = useActionState<State, FormData>(createFieldRequisition, null);

  return (
    <div className="screen screen-anim">
      <div className="scr-eye">Purchase Requests</div>
      <h1 className="scr-h" style={{ marginBottom: 12 }}>
        Request A Purchase
      </h1>

      {state?.error && (
        <div className="ps-alert ps-alert--danger" role="alert" style={{ marginBottom: 12 }}>
          {state.error}
        </div>
      )}

      <form action={formAction}>
        <div className="fld">
          <label htmlFor="title">What do you need?</label>
          <input id="title" name="title" required maxLength={200} placeholder="e.g. Gel frame, 6&quot; — 2 off" />
          {state?.fieldErrors?.title && <div className="hint">{state.fieldErrors.title}</div>}
        </div>

        <div className="fld">
          <label htmlFor="estimated">Rough cost</label>
          {/* decimal keypad, not the full keyboard — one hand, gloves on. */}
          <input id="estimated" name="estimated" inputMode="decimal" placeholder="40.00" />
          <div className="hint">Optional. A guess is more useful than nothing.</div>
        </div>

        <div className="fld">
          <label htmlFor="description">Why / where</label>
          <textarea
            id="description"
            name="description"
            placeholder="What broke, where it's needed, when it's needed by…"
          />
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <Link
            href="/m/requisitions"
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
            <KIcon name="Send" size={15} /> {pending ? "Sending…" : "Raise Request"}
          </button>
        </div>
      </form>
    </div>
  );
}
