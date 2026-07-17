"use client";

import { useCallback, useRef, useState } from "react";
import type { ScanMode } from "@/lib/scan/formats";
import { submitScanCode, type ScanOutcome } from "./submitScanCode";

/**
 * Stateful submit path for field scan surfaces (/m/check-in, /m/inventory/scan,
 * manual entry). Wraps `submitScanCode` — which owns validation, the POST, and
 * the haptic/beep feedback — with single-flight + the latest outcome as state.
 *
 * Posts to the queueable `/api/v1/scan` endpoint via client fetch so the
 * service worker's offline queue applies: a scan made with no signal is
 * durably recorded and replayed on reconnect.
 *
 * Outcomes:
 *   result — the server journaled the scan and returned its verdict.
 *   queued — recorded on-device, will sync when online. IMPORTANT: a queued
 *            scan is NOT verified against the roster yet, so callers must
 *            present it as "recorded, pending sync", never as an accept.
 *   error  — a real rejection (auth, validation, misread). Surface it.
 *
 * Single-flight with a buffer: camera decodes arriving while a submit is in
 * flight are buffered (not dropped) and submitted FIFO afterwards.
 *
 * `mode` constrains what may resolve (an `access` surface only ever consults
 * entitlements) and is sent with every submit.
 */

export type { ScanOutcome } from "./submitScanCode";

export function useScanSubmit(mode: ScanMode = "any") {
  const [pending, setPending] = useState(false);
  const [outcome, setOutcome] = useState<ScanOutcome | null>(null);
  const inFlightRef = useRef(false);
  const bufferRef = useRef<Array<{ code: string; format?: string }>>([]);

  const submit = useCallback(
    async (raw: string, format?: string): Promise<void> => {
      const code = raw.trim();
      if (!code) return;

      if (inFlightRef.current) {
        // Buffer, don't drop — a burst of decodes during flight replays FIFO.
        if (!bufferRef.current.some((b) => b.code === code)) bufferRef.current.push({ code, format });
        return;
      }
      inFlightRef.current = true;
      setPending(true);
      try {
        // Drain the current code plus anything buffered while in flight.
        let current: { code: string; format?: string } | undefined = { code, format };
        while (current) {
          const next = await submitScanCode(current.code, { format: current.format, mode });
          if (next) setOutcome(next);
          current = bufferRef.current.shift();
        }
      } finally {
        inFlightRef.current = false;
        setPending(false);
      }
    },
    [mode],
  );

  return { submit, pending, outcome };
}
