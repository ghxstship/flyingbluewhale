"use client";

import * as React from "react";
import { CameraScanner, type ScannedCode } from "@/components/scanners/CameraScanner";
import { formatsForMode } from "@/lib/scan/formats";
import { useFormatters } from "@/lib/i18n/LocaleProvider";
import { verifyAccessCode } from "./actions";
import type { ScanResult } from "@/lib/db/assignments";

/**
 * Console-side access-control surface built on the <CameraScanner> primitive
 * (kit v7 §3). Each decode is verified against the real `assignments` domain
 * via `verifyAccessCode` (server action → `scanAssignment`): the code is
 * resolved, the assignment is conditionally redeemed, and the attempt is
 * journaled to `assignment_events`. The verdict tone reflects the true result
 * — accepted / duplicate / voided / expired / unknown — never a blind grant.
 * Token-only colors.
 */
export type AccessControlScannerProps = {
  labels: {
    hint: string;
    recentTitle: string;
    recentEmpty: string;
    checking: string;
    accepted: string;
    duplicate: string;
    voided: string;
    expired: string;
    unknown: string;
    error: string;
  };
};

type Verdict = "checking" | ScanResult["result"] | "error";

type Entry = {
  id: number;
  value: string;
  verdict: Verdict;
  detail: string | null;
};

const TONE: Record<Verdict, { fg: string; bg: string }> = {
  checking: { fg: "var(--p-text-2)", bg: "var(--p-surface-2)" },
  accepted: { fg: "var(--p-success-text)", bg: "color-mix(in srgb, var(--p-success) 15%, transparent)" },
  duplicate: { fg: "var(--p-warning-text)", bg: "color-mix(in srgb, var(--p-warning) 15%, transparent)" },
  voided: { fg: "var(--p-danger-text)", bg: "color-mix(in srgb, var(--p-danger) 15%, transparent)" },
  expired: { fg: "var(--p-danger-text)", bg: "color-mix(in srgb, var(--p-danger) 15%, transparent)" },
  not_found: { fg: "var(--p-danger-text)", bg: "color-mix(in srgb, var(--p-danger) 15%, transparent)" },
  error: { fg: "var(--p-danger-text)", bg: "color-mix(in srgb, var(--p-danger) 15%, transparent)" },
};

export function AccessControlScanner({ labels }: AccessControlScannerProps): React.ReactElement {
  const fmt = useFormatters();
  const [log, setLog] = React.useState<Entry[]>([]);
  const seq = React.useRef(0);
  // Throttle duplicate decodes of the same code within a short window so the
  // camera firing repeatedly on one credential doesn't spam the gate log.
  const lastSeen = React.useRef<Map<string, number>>(new Map());

  const verdictLabel = React.useCallback(
    (v: Verdict): string =>
      v === "checking"
        ? labels.checking
        : v === "accepted"
          ? labels.accepted
          : v === "duplicate"
            ? labels.duplicate
            : v === "voided"
              ? labels.voided
              : v === "expired"
                ? labels.expired
                : v === "not_found"
                  ? labels.unknown
                  : labels.error,
    [labels],
  );

  const onScan = React.useCallback((code: ScannedCode) => {
    const value = code.value.trim();
    if (!value) return;
    const now = Date.now();
    const prev = lastSeen.current.get(value);
    if (prev && now - prev < 3000) return; // de-dupe rapid re-reads
    lastSeen.current.set(value, now);

    const id = ++seq.current;
    const pending: Entry = { id, value, verdict: "checking", detail: null };
    setLog((cur) => [pending, ...cur].slice(0, 30));

    void verifyAccessCode(value).then((res) => {
      let verdict: Verdict;
      let detail: string | null = null;
      if (!res.ok) {
        verdict = "error";
        detail = res.error;
      } else {
        verdict = res.result.result;
        if (res.result.result === "accepted") detail = res.result.title;
        else if (res.result.result === "duplicate" && res.result.redeemedAt) {
          detail = fmt.time(new Date(res.result.redeemedAt));
        }
      }
      setLog((cur) => cur.map((e) => (e.id === id ? { ...e, verdict, detail } : e)));
    });
  }, [fmt]);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_1fr]">
      <div className="space-y-3">
        <div className="relative overflow-hidden rounded-[var(--p-r-lg,12px)] border border-[var(--p-border)] bg-[var(--p-surface)]">
          <CameraScanner onScan={onScan} formats={formatsForMode("access")} />
          <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-2/3 w-2/3 rounded-[var(--p-r,8px)] border-2 border-[var(--p-accent)]/70" />
          </div>
        </div>
        <p className="text-sm text-[var(--p-text-2)]">{labels.hint}</p>
      </div>

      <section className="rounded-[var(--p-r,8px)] border border-[var(--p-border)] bg-[var(--p-surface)]">
        <h2 className="border-b border-[var(--p-border)] px-4 py-2.5 font-mono text-xs tracking-[0.08em] text-[var(--p-text-3)] uppercase">
          {labels.recentTitle}
        </h2>
        {/* A11Y-2: async verdicts land here after the camera decode — announce
            them politely so screen-reader operators hear the gate result. */}
        <div role="status" aria-live="polite">
        {log.length === 0 ? (
          <p className="px-4 py-6 text-sm text-[var(--p-text-3)]">{labels.recentEmpty}</p>
        ) : (
          <ul className="divide-y divide-[var(--p-border)]">
            {log.map((e) => {
              const tone = TONE[e.verdict];
              return (
                <li key={e.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                  <span className="min-w-0">
                    <code className="block truncate font-mono text-[var(--p-text-1)]">{e.value}</code>
                    {e.detail ? <span className="text-xs text-[var(--p-text-3)]">{e.detail}</span> : null}
                  </span>
                  <span
                    className="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium"
                    style={{ color: tone.fg, background: tone.bg }}
                  >
                    {verdictLabel(e.verdict)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
        </div>
      </section>
    </div>
  );
}
