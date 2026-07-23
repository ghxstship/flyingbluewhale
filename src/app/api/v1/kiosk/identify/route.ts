import { type NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiOk, parseJson } from "@/lib/api";
import { KIOSK_DEVICE_COOKIE } from "@/lib/kiosk/device-token";
import { identifyByPassCode, identifyByPin, isKioskAvailable, resolveKioskDevice } from "@/lib/kiosk/server";

/**
 * /api/v1/kiosk/identify — T1-4 kiosk mode, step 1 of a punch.
 *
 * SESSION-LESS by design: the caller is a registered site tablet whose only
 * credential is the httpOnly device-token cookie set at registration. The
 * body carries a PIN or a pass-QR payload; the server resolves it to exactly
 * one worker in the DEVICE's org and returns the confirm-card identity (name,
 * role, current clock state). No user ids cross the wire in either direction
 * beyond that card — the punch endpoint re-resolves identity itself, so this
 * response is never an authorization artifact.
 *
 * Rate limiting: device-scoped PIN lockout (kiosk_devices.failed_pin_attempts
 * / pin_locked_until, escalating 30s→15m). Refusals are honest: a lock says
 * how long, an unlinked pass says why.
 */

const PostSchema = z.object({
  method: z.enum(["pin", "code"]),
  /** The PIN digits or the scanned pass-QR payload. Never logged. */
  secret: z.string().min(1).max(200),
});

export async function POST(req: NextRequest) {
  const input = await parseJson(req, PostSchema);
  if (input instanceof Response) return input;

  if (!isKioskAvailable()) {
    return apiError("service_unavailable", "Kiosk mode is not configured on this deployment.");
  }

  const device = await resolveKioskDevice(req.cookies.get(KIOSK_DEVICE_COOKIE)?.value);
  if (!device) {
    return apiError("unauthorized", "This device is not registered for kiosk mode.", {
      code: "device_unregistered",
    });
  }

  const result =
    input.method === "pin" ? await identifyByPin(device, input.secret) : await identifyByPassCode(device, input.secret);

  if (!result.ok) {
    if (result.code === "locked") {
      return apiError("rate_limited", "PIN entry is locked on this device.", {
        code: "pin_locked",
        retryAfterS: result.retryAfterS ?? null,
      });
    }
    if (result.code === "not_configured") {
      return apiError("service_unavailable", "PIN sign-in is not configured. Use your pass QR instead.", {
        code: "pin_not_configured",
      });
    }
    if (result.code === "pass_unlinked") {
      return apiError("unprocessable", "This pass is not linked to a punchable account.", {
        code: "pass_unlinked",
      });
    }
    // pin_invalid / pass_invalid — deliberately generic (no oracle).
    return apiError("unauthorized", input.method === "pin" ? "PIN not recognized." : "Pass not recognized.", {
      code: result.code,
    });
  }

  return apiOk({
    worker: {
      name: result.worker.name,
      avatarUrl: result.worker.avatarUrl,
      role: result.worker.role,
    },
    clockedIn: result.punchState.clockedIn,
    onBreak: result.punchState.onBreak,
  });
}
