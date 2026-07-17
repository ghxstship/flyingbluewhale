"use client";

import { useCallback } from "react";
import {
  MISREAD_MESSAGE,
  ScanCapture,
  submitScanCode,
  type ScanCaptureLabels,
  type ScanEntryStatus,
} from "@/components/scanners";
import type { ResolvedScan } from "@/lib/scan/types";

export type QuickScanLabels = ScanCaptureLabels & {
  results: Record<ResolvedScan["result"], string>;
  queued: string;
  failed: string;
  /** Shown when a retail barcode fails its own check digit — a misread. */
  misread?: string;
};

const RESULT_TONE: Record<ResolvedScan["result"], ScanEntryStatus["tone"]> = {
  accepted: "ok",
  asset: "ok",
  duplicate: "warn",
  expired: "warn",
  voided: "danger",
  not_found: "neutral",
};

/**
 * /m/scan client island — wires ScanCapture's `onCapture` to the queueable
 * `/api/v1/scan` endpoint so every capture lands in the assignment scan
 * journal (or the offline queue) instead of evaporating in a session log.
 * The per-row status shows the journaled verdict; a scan made offline shows
 * "queued" and replays on reconnect.
 *
 * This is the `any`-mode lookup surface: it decodes the full symbology union
 * (a lookup tool, not an authorization decision) and therefore validates GTIN
 * check digits before submitting. See
 * docs/compvss/SCANNING_UNIVERSAL_CAPTURE_PLAN.md §1.3.
 */
export function QuickScan({ labels }: { labels: QuickScanLabels }) {
  const onCapture = useCallback(
    async (value: string, _source: "camera" | "manual", format?: string): Promise<ScanEntryStatus> => {
      // `submitScanCode` owns the GTIN check-digit guard, the POST, and the
      // haptic feedback — shared with `useScanSubmit`. Quick Scan calls it
      // per-code rather than through that hook because ScanCapture patches a
      // status onto the log ROW that produced the code, and the hook's
      // single-flight buffer deliberately returns early for a buffered code.
      const outcome = await submitScanCode(value, { format, mode: "any" });
      if (!outcome) return { label: labels.failed, tone: "danger" };
      if (outcome.kind === "result") {
        return {
          label: labels.results[outcome.result.result] ?? outcome.result.result,
          tone: RESULT_TONE[outcome.result.result] ?? "neutral",
        };
      }
      if (outcome.kind === "queued") return { label: labels.queued, tone: "warn" };
      return {
        label: outcome.message === MISREAD_MESSAGE ? (labels.misread ?? labels.failed) : labels.failed,
        tone: "danger",
      };
    },
    [labels],
  );

  const captureLabels: ScanCaptureLabels = {
    hint: labels.hint,
    manualToggle: labels.manualToggle,
    manualLabel: labels.manualLabel,
    manualPlaceholder: labels.manualPlaceholder,
    manualSubmit: labels.manualSubmit,
    recentTitle: labels.recentTitle,
    recentEmpty: labels.recentEmpty,
  };
  return <ScanCapture labels={captureLabels} onCapture={onCapture} />;
}
