"use client";

import { useCallback, useRef, useState } from "react";
import type { ScanResult } from "@/lib/db/assignments";
import { postFieldWrite } from "@/lib/offline/outbox";
import { scanFeedback } from "@/lib/haptics";

/**
 * Shared submit path for field scan surfaces (/m/check-in, /m/inventory/scan,
 * /m/scan, manual entry). Posts to the queueable `/api/v1/scan` endpoint via
 * client fetch so the service worker's offline queue applies: a scan made
 * with no signal is durably recorded and replayed on reconnect.
 *
 * Outcomes:
 *   result — the server journaled the scan and returned its verdict.
 *   queued — recorded on-device, will sync when online. IMPORTANT: a queued
 *            scan is NOT verified against the roster yet, so callers must
 *            present it as "recorded, pending sync", never as an accept.
 *   error  — a real rejection (auth, validation). Surface it.
 *
 * Single-flight with a buffer: camera decodes arriving while a submit is in
 * flight are buffered (not dropped) and submitted FIFO afterwards. Haptic +
 * beep feedback fires per outcome (success / warning / error).
 */

export type ScanOutcome =
  | { kind: "result"; result: ScanResult }
  | { kind: "queued"; code: string }
  | { kind: "error"; message: string };

/** Scan verdict → non-visual feedback tone. `not_found`/`voided` are gate
 * rejections; `duplicate`/`expired` are cautionary. */
const RESULT_FEEDBACK: Record<ScanResult["result"], "success" | "warning" | "error"> = {
  accepted: "success",
  duplicate: "warning",
  expired: "warning",
  voided: "error",
  not_found: "error",
};

export function useScanSubmit() {
  const [pending, setPending] = useState(false);
  const [outcome, setOutcome] = useState<ScanOutcome | null>(null);
  const inFlightRef = useRef(false);
  const bufferRef = useRef<string[]>([]);

  const submit = useCallback(async (raw: string): Promise<void> => {
    const code = raw.trim();
    if (!code) return;
    if (inFlightRef.current) {
      // Buffer, don't drop — a burst of decodes during flight replays FIFO.
      if (!bufferRef.current.includes(code)) bufferRef.current.push(code);
      return;
    }
    inFlightRef.current = true;
    setPending(true);
    try {
      // Drain the current code plus anything buffered while in flight.
      let current: string | undefined = code;
      while (current) {
        const res = await postFieldWrite<ScanResult>("/api/v1/scan", { code: current });
        if (res.status === "ok") {
          scanFeedback(RESULT_FEEDBACK[res.data.result] ?? "warning");
          setOutcome({ kind: "result", result: res.data });
        } else if (res.status === "queued") {
          // Recorded on-device, unverified until replay — cautionary cue.
          scanFeedback("warning");
          setOutcome({ kind: "queued", code: current });
        } else {
          scanFeedback("error");
          setOutcome({ kind: "error", message: res.message });
        }
        current = bufferRef.current.shift();
      }
    } finally {
      inFlightRef.current = false;
      setPending(false);
    }
  }, []);

  return { submit, pending, outcome };
}
