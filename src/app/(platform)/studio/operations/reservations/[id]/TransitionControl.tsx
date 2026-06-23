"use client";

import { FormShell } from "@/components/FormShell";
import { useT } from "@/lib/i18n/LocaleProvider";
import {
  NEXT_RESERVATION_STATES,
  RESERVATION_STATE_LABELS,
  type ReservationState,
} from "@/lib/reservations";
import { transitionReservation } from "../actions";

/**
 * Reservation state-transition row. Renders only the states reachable from the
 * current one (per NEXT_RESERVATION_STATES); the server action re-validates the
 * jump so a stale tab can't write an illegal transition.
 */
export function TransitionControl({
  reservationId,
  current,
}: {
  reservationId: string;
  current: ReservationState;
}) {
  const t = useT();
  const next = NEXT_RESERVATION_STATES[current];

  if (next.length === 0) {
    return (
      <p className="text-sm text-[var(--p-text-2)]">
        {t("console.reservations.detail.terminal", undefined, "This reservation is in a final state.")}
      </p>
    );
  }

  return (
    <FormShell
      action={transitionReservation}
      submitLabel={t("console.reservations.detail.advance", undefined, "Update state")}
      dirtyGuard={false}
      className="space-y-3"
    >
      <input type="hidden" name="reservation_id" value={reservationId} />
      <div>
        <label className="text-xs font-medium text-[var(--p-text-2)]" htmlFor="res-to-state">
          {t("console.reservations.detail.moveTo", undefined, "Move to")}
        </label>
        <select id="res-to-state" name="to_state" defaultValue={next[0]} className="ps-input mt-1.5 w-full">
          {next.map((s) => (
            <option key={s} value={s}>
              {RESERVATION_STATE_LABELS[s]}
            </option>
          ))}
        </select>
      </div>
    </FormShell>
  );
}
