"use client";

import * as React from "react";
import { CameraScanner, type ScannedCode } from "./CameraScanner";
import { Button } from "@/components/ui/Button";

/**
 * ScanCapture — the field-app capture surface built on the CameraScanner
 * primitive (kit v7 §3). CameraScanner is the bare video + decode loop;
 * ScanCapture adds the operator chrome around it: a scan reticle, a manual
 * code-entry fallback, an in-session log of decoded codes, and a single
 * `onCapture(code)` callback the caller wires to its submit path.
 *
 * `onCapture` may (async) return a `ScanEntryStatus` — the log row then
 * shows the journaled outcome (accepted / duplicate / queued offline / …)
 * next to the code instead of leaving captures unaccounted for.
 *
 * Generic + presentational — no Supabase, no i18n. Callers pass already
 * translated labels and an `onCapture` handler. Token-only colors.
 */
export type ScanCaptureLabels = {
  hint: string;
  manualToggle: string;
  manualLabel: string;
  manualPlaceholder: string;
  manualSubmit: string;
  recentTitle: string;
  recentEmpty: string;
};

export type ScanEntryStatus = {
  label: string;
  tone: "ok" | "warn" | "danger" | "neutral";
};

export type ScanCaptureProps = {
  labels: ScanCaptureLabels;
  /** Fired once per accepted code (camera decode or manual submit). May
   * resolve to a status shown on the log row. `format` is the decoded
   * symbology when the camera knows it (absent for manual entry) — callers
   * need it to validate GTIN-bearing codes before they resolve. */
  onCapture?: (
    value: string,
    source: "camera" | "manual",
    format?: string,
  ) => void | Promise<ScanEntryStatus | void>;
  /** Restrict the camera to specific symbologies. */
  formats?: readonly string[];
  /** Keep scanning after a hit. Default true. */
  continuous?: boolean;
  className?: string;
};

type LogEntry = {
  id: number;
  value: string;
  source: "camera" | "manual";
  at: number;
  status?: ScanEntryStatus;
};

const TONE_COLOR: Record<ScanEntryStatus["tone"], string> = {
  ok: "var(--p-success-text, var(--p-success))",
  warn: "var(--p-warning-text, var(--p-warning))",
  danger: "var(--p-danger-text, var(--p-danger))",
  neutral: "var(--p-text-3)",
};

let entrySeq = 0;

export function ScanCapture({
  labels,
  onCapture,
  formats,
  continuous = true,
  className = "",
}: ScanCaptureProps): React.ReactElement {
  const [manualOpen, setManualOpen] = React.useState(false);
  const [manual, setManual] = React.useState("");
  const [log, setLog] = React.useState<LogEntry[]>([]);

  const capture = React.useCallback(
    (value: string, source: "camera" | "manual", format?: string) => {
      const trimmed = value.trim();
      if (!trimmed) return;
      const id = ++entrySeq;
      setLog((prev) => [{ id, value: trimmed, source, at: Date.now() }, ...prev].slice(0, 10));
      const maybe = onCapture?.(trimmed, source, format);
      if (maybe && typeof (maybe as Promise<ScanEntryStatus | void>).then === "function") {
        void (maybe as Promise<ScanEntryStatus | void>)
          .then((status) => {
            if (!status) return;
            setLog((prev) => prev.map((e) => (e.id === id ? { ...e, status } : e)));
          })
          .catch(() => {});
      }
    },
    [onCapture],
  );

  const onScan = React.useCallback((code: ScannedCode) => capture(code.value, "camera", code.format), [capture]);

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      <div className="relative overflow-hidden rounded-[var(--p-r-lg,12px)] border border-[var(--p-border)] bg-[var(--p-surface)]">
        <CameraScanner onScan={onScan} formats={formats} continuous={continuous} />
        {/* Reticle overlay — corner-frame guide. */}
        <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-2/3 w-2/3 rounded-[var(--p-r,8px)] border-2 border-[var(--p-accent)]/70" />
        </div>
      </div>

      <p className="text-center text-sm text-[var(--p-text-2)]">{labels.hint}</p>

      <div>
        <button
          type="button"
          onClick={() => setManualOpen((v) => !v)}
          aria-expanded={manualOpen}
          className="text-sm font-medium text-[var(--p-accent-text)] underline-offset-2 hover:underline"
        >
          {labels.manualToggle}
        </button>
        {manualOpen && (
          <form
            className="mt-2 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              capture(manual, "manual");
              setManual("");
            }}
          >
            <label className="sr-only" htmlFor="scan-manual-code">
              {labels.manualLabel}
            </label>
            <input
              id="scan-manual-code"
              value={manual}
              onChange={(e) => setManual(e.target.value)}
              placeholder={labels.manualPlaceholder}
              className="flex-1 rounded-md border border-[var(--p-border)] bg-[var(--p-bg)] px-3 py-2 text-sm"
            />
            <Button type="submit" variant="cta" size="sm">
              {labels.manualSubmit}
            </Button>
          </form>
        )}
      </div>

      <section className="rounded-[var(--p-r,8px)] border border-[var(--p-border)] bg-[var(--p-surface)]">
        <h2 className="border-b border-[var(--p-border)] px-3 py-2 font-mono text-xs tracking-[0.08em] text-[var(--p-text-3)] uppercase">
          {labels.recentTitle}
        </h2>
        {log.length === 0 ? (
          <p className="px-3 py-4 text-sm text-[var(--p-text-3)]">{labels.recentEmpty}</p>
        ) : (
          <ul className="divide-y divide-[var(--p-border)]">
            {log.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                <code
                  className="truncate font-mono text-[var(--p-text-1)]"
                  style={{ fontFamily: "var(--p-mono-data)" }}
                >
                  {e.value}
                </code>
                <span className="flex shrink-0 items-center gap-2 text-xs">
                  {e.status && (
                    <span className="font-medium" style={{ color: TONE_COLOR[e.status.tone] }}>
                      {e.status.label}
                    </span>
                  )}
                  <span className="text-[var(--p-text-3)]">{e.source}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
