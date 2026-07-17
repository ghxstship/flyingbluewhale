"use client";

import { postFieldWrite } from "@/lib/offline/outbox";
import { scanFeedback } from "@/lib/haptics";
import type { ScanMode } from "@/lib/scan/formats";
import { isGtinFormat, normalizeGtin } from "@/lib/scan/gtin";
import type { ResolvedScan } from "@/lib/scan/types";

/**
 * One scan submit, start to finish: validate → POST → feedback → outcome.
 *
 * This is the shared core behind BOTH field submit paths. It exists because
 * they legitimately differ in shape and cannot be collapsed into one:
 *
 *   `useScanSubmit`  — stateful. Single-flight with a FIFO buffer, exposes the
 *                      latest outcome as React state. Right for a surface with
 *                      one live outcome card (the shared ScanSurface behind
 *                      /m/check-in, /m/scan and /m/inventory/scan).
 *   `ScanCapture`    — per-code callers. It patches a status onto the log ROW
 *                      for the code that produced it, so it needs a result per
 *                      call. The hook's buffer deliberately returns early for
 *                      a buffered code, which would leave that row with no
 *                      status forever.
 *
 * Factoring the core out is what removes the real duplication (the GTIN guard,
 * the feedback map, the endpoint) without breaking either contract.
 */

export type ScanOutcome =
  | { kind: "result"; result: ResolvedScan }
  | { kind: "queued"; code: string }
  | { kind: "error"; message: string };

/**
 * Scan verdict → non-visual feedback tone. `not_found`/`voided` are gate
 * rejections; `duplicate`/`expired` are cautionary. `asset` is a successful
 * identification (resolver 2), not an entitlement accept — but it IS a hit, so
 * it earns the success cue: operators at a gate are listening, not reading.
 */
export const RESULT_FEEDBACK: Record<ResolvedScan["result"], "success" | "warning" | "error"> = {
  accepted: "success",
  asset: "success",
  duplicate: "warning",
  expired: "warning",
  voided: "error",
  not_found: "error",
};

/** Copy for a code that failed its own check digit. */
export const MISREAD_MESSAGE = "Misread barcode — scan again";

/**
 * Submit one code and fire its feedback. Never throws.
 *
 * A GTIN-bearing symbology whose mod-10 check digit fails is a misread, not a
 * product: it is rejected here, at the edge, and never reaches a resolver (or,
 * later, a metered external lookup). Non-GTIN formats are untouched — a QR
 * wristband payload is not a GTIN and must not be checksum-gated.
 */
export async function submitScanCode(
  raw: string,
  opts: { format?: string; mode: ScanMode },
): Promise<ScanOutcome | null> {
  const code = raw.trim();
  if (!code) return null;

  if (isGtinFormat(opts.format) && !normalizeGtin(code).ok) {
    scanFeedback("error");
    return { kind: "error", message: MISREAD_MESSAGE };
  }

  const res = await postFieldWrite<ResolvedScan>("/api/v1/scan", {
    code,
    format: opts.format,
    mode: opts.mode,
  });

  if (res.status === "ok") {
    scanFeedback(RESULT_FEEDBACK[res.data.result] ?? "warning");
    return { kind: "result", result: res.data };
  }
  if (res.status === "queued") {
    // Recorded on-device, unverified until replay — cautionary cue, never an
    // accept. A queued scan has not been checked against the roster.
    scanFeedback("warning");
    return { kind: "queued", code };
  }
  scanFeedback("error");
  return { kind: "error", message: res.message };
}
