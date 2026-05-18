"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { formatTime } from "@/lib/i18n/format";

/**
 * RunTimeline — vertical step timeline rendered on a single-run page.
 *
 * Each step shows: index, action type, status badge, latency, started-at,
 * and collapsible JSON viewers for input/output/error. Mirrors the
 * SmartSuite run-detail layout — left-rail status dot, right-side card.
 *
 * Per [SmartSuite Run History](https://help.smartsuite.com/en/articles/7115398-automation-run-history-erroring).
 */

type StepStatus = "pending" | "running" | "success" | "failed" | "skipped";

const STATUS_TONE: Record<StepStatus, "muted" | "info" | "success" | "warning" | "error"> = {
  pending: "muted",
  running: "info",
  success: "success",
  skipped: "warning",
  failed: "error",
};

// `animate-pulse` on `running` is a status indicator (not a skeleton). It
// signals that an automation step is currently executing — the only
// intentional pulse usage in the platform; everywhere else, animate-pulse
// means "loading skeleton" and should use the .skeleton utility.
const STATUS_DOT: Record<StepStatus, string> = {
  pending: "bg-[var(--text-muted)]",
  running: "bg-[var(--org-primary)] motion-safe:animate-pulse",
  success: "bg-emerald-500",
  skipped: "bg-amber-500",
  failed: "bg-[var(--color-error)]",
};

export type RunTimelineStep = {
  stepIndex: number;
  actionType: string;
  status: StepStatus;
  input: unknown;
  output: unknown;
  error?: string;
  startedAt?: string;
  finishedAt?: string;
  latencyMs?: number;
};

export type RunTimelineProps = {
  steps: RunTimelineStep[];
};

function fmtTime(iso?: string): string {
  if (!iso) return "—";
  return formatTime(iso);
}

function fmtLatency(ms?: number): string {
  if (ms == null) return "—";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function jsonString(v: unknown): string {
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v);
  }
}

function CollapsibleJson({ label, value, defaultOpen }: { label: string; value: unknown; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(!!defaultOpen);
  // Don't bother showing a section for an empty payload — keeps the timeline tidy.
  const isEmpty =
    value == null ||
    (typeof value === "object" && !Array.isArray(value) && Object.keys(value as object).length === 0) ||
    (typeof value === "string" && value.length === 0);

  if (isEmpty) {
    return <div className="text-[10px] tracking-wide text-[var(--text-muted)] uppercase">{label}: empty</div>;
  }
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-[10px] tracking-wide text-[var(--text-muted)] uppercase hover:text-[var(--foreground)]"
      >
        {open ? "▾" : "▸"} {label}
      </button>
      {open && (
        <pre className="mt-1 max-h-72 overflow-auto rounded bg-[var(--bg-secondary)] p-2 font-mono text-xs">
          {jsonString(value)}
        </pre>
      )}
    </div>
  );
}

export function RunTimeline({ steps }: RunTimelineProps) {
  if (steps.length === 0) {
    return <p className="text-xs text-[var(--text-muted)]">No steps recorded.</p>;
  }
  return (
    <ol className="relative space-y-3 pl-6">
      {/* Vertical rail — sits behind the status dots. */}
      <div className="absolute top-1 bottom-1 left-[7px] w-px bg-[var(--border-color)]" aria-hidden="true" />
      {steps.map((s) => (
        <li key={s.stepIndex} className="relative">
          <span
            className={`absolute top-2 -left-[1px] inline-block h-3 w-3 rounded-full ring-2 ring-[var(--bg-primary)] ${STATUS_DOT[s.status]}`}
            aria-hidden="true"
          />
          <div className="surface rounded border border-[var(--border-color)] p-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs text-[var(--text-muted)]">#{s.stepIndex}</span>
              <span className="text-sm font-semibold">{s.actionType || "(unknown)"}</span>
              <Badge variant={STATUS_TONE[s.status]}>{s.status}</Badge>
              <span className="ml-auto font-mono text-[10px] text-[var(--text-muted)]">
                {fmtTime(s.startedAt)} · {fmtLatency(s.latencyMs)}
              </span>
            </div>
            {s.error && (
              <div className="mt-2 rounded border border-[var(--color-error)] bg-[var(--bg-secondary)] p-2 font-mono text-xs text-[var(--color-error)]">
                {s.error}
              </div>
            )}
            <div className="mt-2 space-y-2">
              <CollapsibleJson label="Input" value={s.input} />
              <CollapsibleJson label="Output" value={s.output} defaultOpen={s.status === "success"} />
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
