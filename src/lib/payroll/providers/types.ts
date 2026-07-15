/**
 * The payroll export driver contract.
 *
 * Every provider — CSV, ADP, Gusto, Workday — implements this. The point of
 * the shape is the rule from TIME_MANAGEMENT_LIFECYCLE_PLAN.md §5.5: a
 * first-party driver is an ORDINARY CLIENT of the public API. It gets no
 * private path, no privileged read, no bespoke server work. If a driver
 * needs something the documented surface can't give it, that's a gap in the
 * surface, not a reason to reach around it.
 *
 * Pure types + pure functions here: no DB, no network. A driver receives a
 * bundle and returns a result; the ledger and the transport are the
 * caller's job.
 */

export type ExportState = "queued" | "sent" | "confirmed" | "partial" | "failed" | "cancelled";
export type ExportLineState = "queued" | "accepted" | "rejected";

/** A worker's identity in the target system. */
export type ExportWorker = {
  partyId: string;
  userId: string | null;
  name: string | null;
  /** From `hr_worker_links`. Null means unmapped — the most common reason a
   *  provider rejects an import, so drivers must refuse rather than guess. */
  externalEmployeeId: string | null;
};

export type ExportLine = {
  /** `payroll_run_lines.id` — the ledger keys per-line outcomes on this. */
  id: string;
  worker: ExportWorker;
  earningCode: string;
  hours: number;
  classification: string | null;
  costCenter: string | null;
};

export type PayrollRunBundle = {
  runId: string;
  orgId: string;
  orgName: string;
  projectName: string | null;
  periodStart: string;
  periodEnd: string;
  weekEnding: string;
  lines: ExportLine[];
};

/**
 * A reason an export must not proceed. `blocking: true` stops the export —
 * these are refusals, not warnings, because a payroll import that half-works
 * is worse than one that doesn't run.
 */
export type ValidationIssue = {
  code: "unmapped_worker" | "no_lines" | "zero_hours" | "period_mismatch" | "missing_earning_code";
  message: string;
  blocking: boolean;
  lineId?: string;
};

export type ExportResult = {
  state: ExportState;
  externalBatchId?: string | null;
  /** Per-line outcomes. A driver that can't report per-line marks them all
   *  the same as the batch — honest, if coarse. */
  lines: Array<{ id: string; state: ExportLineState; externalLineId?: string | null; errorCode?: string; errorMessage?: string }>;
  /** Bytes to hand the operator, for file-drop drivers. */
  artifact?: { filename: string; contentType: string; body: string } | null;
  error?: string | null;
};

export type ReconcileResult = {
  state: ExportState;
  accepted: number;
  rejected: number;
  lines: Array<{ id: string; state: ExportLineState; errorMessage?: string }>;
};

export interface PayrollExportDriver {
  readonly provider: string;
  readonly capabilities: {
    /** Can it push to the provider itself, or only produce an artifact? */
    push: boolean;
    /** Can it ask the provider what happened after the fact? */
    poll: boolean;
    /** Can it re-send only the rejected lines? */
    partialRetry: boolean;
  };
  /** Refuse before sending. Blocking issues must stop the export. */
  validate(run: PayrollRunBundle): Promise<ValidationIssue[]>;
  /** `idempotencyKey` is forwarded to providers that support one. */
  export(run: PayrollRunBundle, idempotencyKey: string): Promise<ExportResult>;
  reconcile(externalBatchId: string): Promise<ReconcileResult>;
}

/** Blocking issues, extracted — the caller's gate before `export`. */
export function blockingIssues(issues: ValidationIssue[]): ValidationIssue[] {
  return issues.filter((i) => i.blocking);
}

/**
 * Shared validation every driver should run before its own.
 *
 * These are the failures that are the PLATFORM's fault, not the provider's:
 * a run with no lines, a line with no hours, a worker with no external id.
 * Catching them here means every driver refuses them identically instead of
 * each discovering them differently at the provider's error endpoint.
 */
export function validateBundle(run: PayrollRunBundle): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (run.lines.length === 0) {
    issues.push({
      code: "no_lines",
      message: "This run has no lines. Post an approved timesheet to it first.",
      blocking: true,
    });
    return issues;
  }

  for (const line of run.lines) {
    if (!line.worker.externalEmployeeId) {
      issues.push({
        code: "unmapped_worker",
        message: `${line.worker.name ?? "A worker"} has no employee id for this provider. Link them in hr_worker_links before exporting.`,
        blocking: true,
        lineId: line.id,
      });
    }
    if (!(line.hours > 0)) {
      issues.push({
        code: "zero_hours",
        message: `A ${line.earningCode} line for ${line.worker.name ?? "a worker"} has no hours. A zero-hour line imports as a paid-nothing record.`,
        blocking: true,
        lineId: line.id,
      });
    }
    if (!line.earningCode) {
      issues.push({
        code: "missing_earning_code",
        message: `A line for ${line.worker.name ?? "a worker"} has no earning code. The provider has nothing to pay it against.`,
        blocking: true,
        lineId: line.id,
      });
    }
  }

  return issues;
}
