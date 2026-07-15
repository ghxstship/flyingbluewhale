"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { postFieldWrite } from "@/lib/offline/outbox";
import { getPosition } from "@/lib/geo/position";
import { haptic } from "@/lib/haptics";

/**
 * Shared clock-in / clock-out submit path for /m/clock and /m/punch.
 *
 * Punches POST the queueable `/api/v1/time/clock` endpoint via client fetch
 * so the service worker's offline queue applies: an offline punch is durably
 * recorded (stamped with the true capture time) and replayed on reconnect.
 *
 * GPS is captured on BOTH directions. The departure fix drives the manager's
 * review and the "leaving site?" nudge; it previously wasn't captured at all
 * (position was only read on clock_in), so there was no geofence data on
 * clock-out to reason about. Denial or timeout stays graceful: the punch
 * still lands, tagged `geofence_state='unknown'`.
 *
 * Geofence policy is enforced server-side; this hook only renders the
 * verdict. A blocked punch returns 422 `geofence_blocked` and surfaces as a
 * "punch anyway, with a reason" prompt rather than an error — a block never
 * denies a worker a way to record time, it only asks them to say why.
 */

export type ClockAction = "clock_in" | "clock_out";

export type GeofenceState = "inside" | "outside" | "unknown";
export type EnforcementState = "clean" | "warned" | "quarantined" | "overridden";

export type PunchOutcome =
  | {
      kind: "ok";
      action: ClockAction;
      geofenceState: GeofenceState | null;
      zoneName: string | null;
      /** Set when the punch was accepted but flagged for a manager. */
      enforcementState?: EnforcementState;
    }
  | { kind: "queued"; action: ClockAction }
  | {
      kind: "blocked";
      action: ClockAction;
      message: string;
      distanceM: number | null;
      zoneName: string | null;
    }
  | { kind: "error"; message: string };

type ClockData = {
  action: ClockAction;
  geofenceState: GeofenceState | null;
  zoneName: string | null;
  enforcementState?: EnforcementState;
};

type BlockDetails = {
  distanceM?: number | null;
  nearestZone?: { id: string; name: string | null } | null;
  overrideAvailable?: boolean;
};

export function useClockPunch() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [outcome, setOutcome] = useState<PunchOutcome | null>(null);

  const punch = useCallback(
    async (action: ClockAction, opts?: { overrideReason?: string }) => {
      if (pending) return;
      setPending(true);
      setOutcome(null);
      try {
        // Stamp the true capture moment — a queued replay records this, not
        // the replay time.
        const at = new Date().toISOString();
        const pos = await getPosition();
        const res = await postFieldWrite<ClockData>("/api/v1/time/clock", {
          action,
          at,
          ...(pos ? { lat: pos.lat, lng: pos.lng } : {}),
          ...(pos?.accuracy != null ? { accuracy: pos.accuracy } : {}),
          ...(opts?.overrideReason ? { overrideReason: opts.overrideReason } : {}),
        });
        if (res.status === "ok") {
          haptic("success");
          setOutcome({
            kind: "ok",
            action,
            geofenceState: res.data.geofenceState ?? null,
            zoneName: res.data.zoneName ?? null,
            enforcementState: res.data.enforcementState,
          });
          router.refresh();
        } else if (res.status === "queued") {
          haptic("success");
          setOutcome({ kind: "queued", action });
        } else if (res.code === "geofence_blocked") {
          // Not a failure: the worker is on the wrong side of a fence and
          // can proceed by explaining why.
          haptic("warning");
          const details = (res.details ?? {}) as BlockDetails;
          setOutcome({
            kind: "blocked",
            action,
            message: res.message,
            distanceM: details.distanceM ?? null,
            zoneName: details.nearestZone?.name ?? null,
          });
        } else {
          haptic("error");
          setOutcome({ kind: "error", message: res.message });
        }
      } finally {
        setPending(false);
      }
    },
    [pending, router],
  );

  const clearOutcome = useCallback(() => setOutcome(null), []);

  return { punch, pending, outcome, clearOutcome };
}
