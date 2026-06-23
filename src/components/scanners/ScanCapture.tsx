"use client";

import * as React from "react";
import { CameraScanner, type ScannedCode } from "./CameraScanner";

/**
 * ScanCapture — the field-app capture surface built on the CameraScanner
 * primitive (kit v7 §3). CameraScanner is the bare video + decode loop;
 * ScanCapture adds the operator chrome around it: a scan reticle, a manual
 * code-entry fallback, an in-session log of decoded codes, and a single
 * `onCapture(code)` callback the caller wires to a server action.
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

export type ScanCaptureProps = {
  labels: ScanCaptureLabels;
  /** Fired once per accepted code (camera decode or manual submit). */
  onCapture?: (value: string, source: "camera" | "manual") => void;
  /** Restrict the camera to specific symbologies. */
  formats?: string[];
  /** Keep scanning after a hit. Default true. */
  continuous?: boolean;
  className?: string;
};

type LogEntry = { value: string; source: "camera" | "manual"; at: number };

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
    (value: string, source: "camera" | "manual") => {
      const trimmed = value.trim();
      if (!trimmed) return;
      setLog((prev) => [{ value: trimmed, source, at: Date.now() }, ...prev].slice(0, 10));
      onCapture?.(trimmed, source);
    },
    [onCapture],
  );

  const onScan = React.useCallback((code: ScannedCode) => capture(code.value, "camera"), [capture]);

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
            <button
              type="submit"
              className="rounded-md bg-[var(--p-accent-cta)] px-3 py-2 text-sm font-semibold text-[var(--p-accent-cta-contrast)] transition-[filter] hover:brightness-95"
            >
              {labels.manualSubmit}
            </button>
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
              <li key={e.at} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                <code className="truncate font-mono text-[var(--p-text-1)]">{e.value}</code>
                <span className="shrink-0 text-xs text-[var(--p-text-3)]">{e.source}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
