"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { postFieldWrite } from "@/lib/offline/outbox";
import { haptic } from "@/lib/haptics";

/**
 * Shared clock-in / clock-out submit path for /m/clock and /m/punch.
 *
 * Punches POST the queueable `/api/v1/time/clock` endpoint via client fetch
 * so the service worker's offline queue applies: an offline punch is durably
 * recorded (stamped with the true capture time) and replayed on reconnect.
 *
 * Clock-in also captures GPS when the user has granted geolocation — the
 * endpoint runs `classifyPunch` against the org's active time-clock zones
 * and records `geofence_state` + zone on the entry. Denial or timeout is
 * graceful: the punch still lands, tagged `geofence_state='unknown'`.
 */

export type ClockAction = "clock_in" | "clock_out";

export type PunchOutcome =
  | {
      kind: "ok";
      action: ClockAction;
      geofenceState: "inside" | "outside" | "unknown" | null;
      zoneName: string | null;
    }
  | { kind: "queued"; action: ClockAction }
  | { kind: "error"; message: string };

type ClockData = {
  action: ClockAction;
  geofenceState: "inside" | "outside" | "unknown" | null;
  zoneName: string | null;
};

/** Best-effort position fix. Resolves null on denial, timeout, or absence —
 * never rejects, never blocks the punch for more than ~4s. */
function getPosition(): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      resolve(null);
      return;
    }
    let settled = false;
    const done = (value: { lat: number; lng: number } | null) => {
      if (!settled) {
        settled = true;
        resolve(value);
      }
    };
    // Belt-and-suspenders timeout — some browsers hang instead of honoring
    // the positionOptions timeout when permission UI is pending.
    const timer = setTimeout(() => done(null), 4500);
    try {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          clearTimeout(timer);
          done({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => {
          clearTimeout(timer);
          done(null);
        },
        { enableHighAccuracy: true, timeout: 4000, maximumAge: 60_000 },
      );
    } catch {
      clearTimeout(timer);
      done(null);
    }
  });
}

export function useClockPunch() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [outcome, setOutcome] = useState<PunchOutcome | null>(null);

  const punch = useCallback(
    async (action: ClockAction) => {
      if (pending) return;
      setPending(true);
      setOutcome(null);
      try {
        // Stamp the true capture moment — a queued replay records this, not
        // the replay time.
        const at = new Date().toISOString();
        const pos = action === "clock_in" ? await getPosition() : null;
        const res = await postFieldWrite<ClockData>("/api/v1/time/clock", {
          action,
          at,
          ...(pos ? { lat: pos.lat, lng: pos.lng } : {}),
        });
        if (res.status === "ok") {
          haptic("success");
          setOutcome({
            kind: "ok",
            action,
            geofenceState: res.data.geofenceState ?? null,
            zoneName: res.data.zoneName ?? null,
          });
          router.refresh();
        } else if (res.status === "queued") {
          haptic("success");
          setOutcome({ kind: "queued", action });
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

  return { punch, pending, outcome };
}
