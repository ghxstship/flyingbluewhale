"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { useT } from "@/lib/i18n/LocaleProvider";

type Translator = (key: string, vars?: Record<string, string | number>, fallback?: string) => string;

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

// `animate-pulse` on `running` is a status indicator (not a ps-skel). It
// signals that an automation step is currently executing — the only
// intentional pulse usage in the platform; everywhere else, animate-pulse
// means "loading ps-skel" and should use the .ps-skel utility.
const STATUS_DOT: Record<StepStatus, string> = {
  pending: "bg-[var(--p-text-2)]",
  running: "bg-[var(--p-accent)] motion-safe:animate-pulse",
  success: "bg-[var(--p-success)]",
  skipped: "bg-[var(--p-warning)]",
  failed: "bg-[var(--p-danger)]",
};

function statusLabel(status: StepStatus, t: Translator): string {
  const fallbacks: Record<StepStatus, string> = {
    pending: "Pending",
    running: "Running",
    success: "Success",
    failed: "Failed",
    skipped: "Skipped",
  };
  return t(`components.runTimeline.status.${status}`, undefined, fallbacks[status]);
}

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
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
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
  const t = useT();
  const [open, setOpen] = useState(!!defaultOpen);
  // Don't bother showing a section for an empty payload — keeps the timeline tidy.
  const isEmpty =
    value == null ||
    (typeof value === "object" && !Array.isArray(value) && Object.keys(value as object).length === 0) ||
    (typeof value === "string" && value.length === 0);

  if (isEmpty) {
    return (
      <div className="text-[10px] tracking-wide text-[var(--p-text-2)] uppercase">
        {t("components.runTimeline.empty", { label }, "{label}: empty")}
      </div>
    );
  }
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-[10px] tracking-wide text-[var(--p-text-2)] uppercase hover:text-[var(--p-text-1)]"
      >
        {open ? "▾" : "▸"} {label}
      </button>
      {open && (
        <pre className="mt-1 max-h-72 overflow-auto rounded bg-[var(--p-surface)] p-2 font-mono text-xs">
          {jsonString(value)}
        </pre>
      )}
    </div>
  );
}

export function RunTimeline({ steps }: RunTimelineProps) {
  const t = useT();
  if (steps.length === 0) {
    return (
      <p className="text-xs text-[var(--p-text-2)]">
        {t("components.runTimeline.noSteps", undefined, "No steps recorded.")}
      </p>
    );
  }
  return (
    <ol className="relative space-y-3 ps-6">
      {/* Vertical rail — sits behind the status dots. */}
      <div className="absolute start-2 top-1 bottom-1 w-px bg-[var(--p-border)]" aria-hidden="true" />
      {steps.map((s) => (
        <li key={s.stepIndex} className="relative">
          <span
            className={`absolute start-0 top-2 inline-block h-3 w-3 rounded-full ring-2 ring-[var(--p-bg)] ${STATUS_DOT[s.status]}`}
            aria-hidden="true"
          />
          <div className="surface rounded border border-[var(--p-border)] p-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs text-[var(--p-text-2)]">#{s.stepIndex}</span>
              <span className="text-sm font-semibold">
                {s.actionType || t("components.runTimeline.unknownAction", undefined, "Unknown")}
              </span>
              <Badge variant={STATUS_TONE[s.status]}>{statusLabel(s.status, t)}</Badge>
              <span className="ms-auto font-mono text-[10px] text-[var(--p-text-2)]">
                {fmtTime(s.startedAt)} · {fmtLatency(s.latencyMs)}
              </span>
            </div>
            {s.error && (
              <div className="mt-2 rounded border border-[var(--p-danger)] bg-[var(--p-surface)] p-2 font-mono text-xs text-[var(--p-danger)]">
                {s.error}
              </div>
            )}
            <div className="mt-2 space-y-2">
              <CollapsibleJson label={t("components.runTimeline.input", undefined, "Input")} value={s.input} />
              <CollapsibleJson
                label={t("components.runTimeline.output", undefined, "Output")}
                value={s.output}
                defaultOpen={s.status === "success"}
              />
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
