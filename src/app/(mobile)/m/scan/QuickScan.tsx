"use client";

import { useCallback } from "react";
import { ScanCapture, type ScanCaptureLabels, type ScanEntryStatus } from "@/components/scanners";
import type { ScanResult } from "@/lib/db/assignments";
import { postFieldWrite } from "@/lib/offline/outbox";
import { scanFeedback } from "@/lib/haptics";

export type QuickScanLabels = ScanCaptureLabels & {
  results: Record<ScanResult["result"], string>;
  queued: string;
  failed: string;
};

const RESULT_TONE: Record<ScanResult["result"], ScanEntryStatus["tone"]> = {
  accepted: "ok",
  duplicate: "warn",
  expired: "warn",
  voided: "danger",
  not_found: "neutral",
};

const RESULT_FEEDBACK: Record<ScanResult["result"], "success" | "warning" | "error"> = {
  accepted: "success",
  duplicate: "warning",
  expired: "warning",
  voided: "error",
  not_found: "error",
};

/**
 * /m/scan client island — wires ScanCapture's `onCapture` to the queueable
 * `/api/v1/scan` endpoint so every capture lands in the assignment scan
 * journal (or the offline queue) instead of evaporating in a session log.
 * The per-row status shows the journaled verdict; a scan made offline shows
 * "queued" and replays on reconnect.
 */
export function QuickScan({ labels }: { labels: QuickScanLabels }) {
  const onCapture = useCallback(
    async (value: string): Promise<ScanEntryStatus> => {
      const res = await postFieldWrite<ScanResult>("/api/v1/scan", { code: value });
      if (res.status === "ok") {
        scanFeedback(RESULT_FEEDBACK[res.data.result] ?? "warning");
        return {
          label: labels.results[res.data.result] ?? res.data.result,
          tone: RESULT_TONE[res.data.result] ?? "neutral",
        };
      }
      if (res.status === "queued") {
        scanFeedback("warning");
        return { label: labels.queued, tone: "warn" };
      }
      scanFeedback("error");
      return { label: labels.failed, tone: "danger" };
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
