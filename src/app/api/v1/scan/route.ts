import { z } from "zod";
import { apiError, apiOk, parseJson } from "@/lib/api";
import { assertCapability, can, withAuth } from "@/lib/auth";
import { resolveScan } from "@/lib/db/scan";
import { SCAN_CAPABILITIES, SCAN_MODE_CAPABILITY } from "@/lib/rbac/capabilities";
import { SCAN_MODES } from "@/lib/scan/formats";
import { keyFromRequest, ratelimit, RATE_BUDGETS } from "@/lib/ratelimit";

/**
 * POST /api/v1/scan — unified gate scan endpoint.
 *
 * The single field-scan entry point. Delegates to the resolver chain
 * (@/lib/db/scan): entitlement codes → asset tags → miss journal. `mode`
 * constrains which resolvers may answer (an `access` surface only ever
 * consults entitlements), and `format` lets the chain refuse a symbology that
 * is out of scope for the surface.
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
  /**
   * Decoded symbology, when the client knows it. Additive + optional so an
   * already-installed client (or a queued scan enqueued by an older build and
   * replayed after an update) still validates.
   */
  format: z.string().max(40).optional(),
  /**
   * The surface's intent, used as a CONSTRAINT on what may resolve — not as a
   * router. `access` restricts resolution to org entitlement codes so a gate
   * can never accept a retail barcode. Defaults to `any`.
   */
  mode: z.enum(SCAN_MODES).optional().default("any"),
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
    // Per-feature gate. `mode` IS the capability: an access surface needs
    // scan:credential, an asset surface scan:asset, a POS surface scan:product.
    // These are add-on grants (role-derived, individual, or time-boxed for a
    // cover shift) unioned over the static floor — see @/lib/rbac/capabilities.
    //
    // `any` (Quick Scan) is not a capability: it is a lookup surface that
    // resolves across domains, so it requires at least one scan capability and
    // the resolver narrows the chain to what the caller actually holds. Asking
    // for a specific capability here would deny an asset-only user a surface
    // that would happily have answered them.
    if (input.mode === "any") {
      if (!SCAN_CAPABILITIES.some((c) => can(session, c))) {
        return apiError("forbidden", "You do not have any scanning capability");
      }
    } else {
      const denial = assertCapability(session, SCAN_MODE_CAPABILITY[input.mode]);
      if (denial) return denial;
    }

    // The resolver chain owns mode-as-constraint, the assets fallback, and the
    // miss journal. See @/lib/db/scan.
    const result = await resolveScan({
      orgId: session.orgId,
      scannerUserId: session.userId,
      code: input.code,
      format: input.format,
      mode: input.mode,
      location: input.location,
      // Entitlement narrows the chain: an asset-only user scanning in `any`
      // mode must not have a credential resolved for them.
      allowed: SCAN_CAPABILITIES.filter((c) => can(session, c)),
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
