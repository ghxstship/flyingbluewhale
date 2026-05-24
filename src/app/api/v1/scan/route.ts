import { z } from "zod";
import { apiError, apiOk, parseJson } from "@/lib/api";
import { assertCapability, withAuth } from "@/lib/auth";
import { scanAssignment } from "@/lib/db/assignments";
import { keyFromRequest, ratelimit, RATE_BUDGETS } from "@/lib/ratelimit";

/**
 * POST /api/v1/scan — unified gate scan endpoint.
 *
 * Scans any assignment_scan_codes.code: ticket barcodes, credential NFC
 * tags, wristband serials, vehicle QR codes, etc. The scan_codes table
 * discriminator (`kind`) is opaque to the caller — the code value is
 * globally unique-when-active per (org, code), so one endpoint handles
 * every kind. Replaces the prior /api/v1/tickets/scan + /tickets/[id]/scan
 * routes that were ticket-specific.
 */

const ScanInput = z.object({
  code: z.string().min(1),
  location: z.object({ lat: z.number(), lng: z.number(), accuracy: z.number().optional() }).optional(),
});

export async function POST(req: Request) {
  // Field-scan bucket — 120/min. Bounds bulk barcode-enumeration and
  // catches stuck scanners.
  const rl = await ratelimit({
    key: keyFromRequest(req, "assignments:scan"),
    ...RATE_BUDGETS.scan,
  });
  if (!rl.ok) return apiError("rate_limited", "Scan rate limit reached");

  const input = await parseJson(req, ScanInput);
  if (input instanceof Response) return input;

  return withAuth(async (session) => {
    if (!session.orgId) return apiError("forbidden", "User is not in an organization");
    const denial = assertCapability(session, "check-in:write");
    if (denial) return denial;
    const result = await scanAssignment({
      orgId: session.orgId,
      scannerUserId: session.userId,
      code: input.code,
      location: input.location,
    });

    if (result.result === "accepted") {
      const { notify } = await import("@/lib/notify");
      await notify({
        orgId: session.orgId,
        userId: null,
        eventType: "assignment.scanned",
        title: `${result.catalogKind} scanned: ${result.title ?? result.assignmentId.slice(0, 8)}`,
        data: {
          assignmentId: result.assignmentId,
          scanCodeId: result.scanCodeId,
          catalogKind: result.catalogKind,
          scannerUserId: session.userId,
        },
      });
    }
    return apiOk(result);
  });
}
