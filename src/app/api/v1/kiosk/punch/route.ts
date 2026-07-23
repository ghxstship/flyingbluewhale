import { type NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiOk, parseJson } from "@/lib/api";
import { emitAudit } from "@/lib/audit";
import { KIOSK_DEVICE_COOKIE } from "@/lib/kiosk/device-token";
import {
  executeKioskPunch,
  identifyByPassCode,
  identifyByPin,
  isKioskAvailable,
  resolveKioskDevice,
} from "@/lib/kiosk/server";

/**
 * /api/v1/kiosk/punch — T1-4 kiosk mode, the punch itself.
 *
 * OWNER CHECK BY CONSTRUCTION (the buddy-punch lesson): the request carries
 * the PIN / pass payload AGAIN — never a user id — and the server re-resolves
 * it to exactly one worker before writing. A kiosk can therefore only ever
 * punch the person whose credential was just presented. The identify call's
 * result is display-only and grants nothing.
 *
 * Provenance: entries land with `source_channel='kiosk'` +
 * `kiosk_device_id`, and every successful punch emits a `kiosk.punch` audit
 * row attributed to the resolved worker with the device in metadata.
 *
 * Queueable: listed in the service worker's QUEUEABLE_ENDPOINTS (and the
 * outbox mirror) so a punch on a flaky venue network is buffered and
 * replayed; `at` preserves the true capture moment. Geofence policy is
 * evaluated server-side from the DEVICE's fix, exactly like /api/v1/time/clock.
 */

const PostSchema = z.object({
  method: z.enum(["pin", "code"]),
  /** The PIN digits or the scanned pass-QR payload. Never logged. */
  secret: z.string().min(1).max(200),
  action: z.enum(["clock_in", "clock_out", "break_start", "break_end"]),
  // Strict ISO datetime; past timestamps allowed (offline replay).
  at: z.string().datetime({ offset: true }).optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  accuracy: z.number().min(0).max(100_000).optional(),
  overrideReason: z.string().min(1).max(500).optional(),
  /** Set by the service worker when replaying a queued punch. */
  replay: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  const input = await parseJson(req, PostSchema);
  if (input instanceof Response) return input;

  // Same skew rule as /api/v1/time/clock: late is fine, future is not.
  if (input.at && new Date(input.at).getTime() > Date.now() + 15 * 60_000) {
    return apiError("bad_request", "Punch timestamp is in the future");
  }

  if (!isKioskAvailable()) {
    return apiError("service_unavailable", "Kiosk mode is not configured on this deployment.");
  }

  const device = await resolveKioskDevice(req.cookies.get(KIOSK_DEVICE_COOKIE)?.value);
  if (!device) {
    return apiError("unauthorized", "This device is not registered for kiosk mode.", {
      code: "device_unregistered",
    });
  }

  const identity =
    input.method === "pin" ? await identifyByPin(device, input.secret) : await identifyByPassCode(device, input.secret);
  if (!identity.ok) {
    if (identity.code === "locked") {
      return apiError("rate_limited", "PIN entry is locked on this device.", {
        code: "pin_locked",
        retryAfterS: identity.retryAfterS ?? null,
      });
    }
    if (identity.code === "not_configured") {
      return apiError("service_unavailable", "PIN sign-in is not configured. Use your pass QR instead.", {
        code: "pin_not_configured",
      });
    }
    return apiError("unauthorized", "Identity could not be verified for this punch.", { code: identity.code });
  }

  const fix =
    typeof input.lat === "number" && typeof input.lng === "number"
      ? { lat: input.lat, lng: input.lng, accuracyM: input.accuracy ?? null }
      : null;

  const result = await executeKioskPunch({
    device,
    worker: identity.worker,
    action: input.action,
    at: input.at,
    fix,
    overrideReason: input.overrideReason,
    isReplay: input.replay === true,
  });

  if (result.kind === "conflict") {
    // 409 is terminal for the offline queue — a duplicate replay is dropped.
    return apiError("conflict", result.message);
  }
  if (result.kind === "blocked") {
    // 422, NOT 409 — same envelope as the clock route so the shell can
    // surface the "punch anyway, with a reason" prompt.
    return apiError("unprocessable", result.message, {
      code: "geofence_blocked",
      geofenceState: result.geofenceState,
      distanceM: result.distanceM,
      nearestZone: result.nearestZone,
      overrideAvailable: result.overrideAvailable,
    });
  }
  if (result.kind === "error") {
    return apiError("internal", result.message);
  }

  // Attributed lineage: the actor IS the resolved worker; the device is
  // context. The secret never appears in metadata.
  await emitAudit({
    actorId: identity.worker.userId,
    orgId: device.orgId,
    actorEmail: identity.worker.email,
    action: "kiosk.punch",
    targetTable: "time_entries",
    targetId: result.entryId,
    metadata: {
      device_id: device.id,
      device_label: device.label,
      punch_action: result.action,
      method: input.method,
      replay: input.replay === true,
    },
  });

  return apiOk({
    action: result.action,
    workerName: identity.worker.name,
    geofenceState: result.geofenceState,
    zoneName: result.zoneName,
    enforcementState: result.enforcementState,
  });
}
