import {
  validateBundle,
  type ExportResult,
  type PayrollExportDriver,
  type PayrollRunBundle,
  type ReconcileResult,
  type ValidationIssue,
} from "./types";

/**
 * The CSV driver — the universal one.
 *
 * Every provider on the roadmap (ADP, Gusto, Workday, Paychex, UKG) accepts
 * an hours import as a file. Unlike their APIs, this needs no partnership,
 * no certification, no mutual-TLS provisioning, and no per-vendor
 * negotiation — so it works today, for everyone, while the native
 * connectors wait on business process that engineering does not control.
 * A large share of real payroll integrations are exactly this.
 *
 * It produces an artifact rather than pushing: `capabilities.push = false`.
 * The operator downloads it and hands it to their provider (or, later, an
 * SFTP transport drops it). That means it cannot report per-line outcomes
 * or reconcile — and it says so rather than pretending, because a driver
 * that claims `accepted` for lines it never confirmed is worse than one
 * that admits it doesn't know.
 */

const COLUMNS = [
  "employee_id",
  "employee_name",
  "earning_code",
  "hours",
  "classification",
  "cost_center",
  "period_start",
  "period_end",
  "week_ending",
] as const;

/**
 * Neutralise spreadsheet formula injection.
 *
 * A cell beginning `=`, `+`, `-`, `@`, or a lone tab/CR is executed as a
 * formula by Excel, Sheets, and LibreOffice on open. Worker names and
 * classifications are user-supplied and flow straight into this file, so a
 * name like `=cmd|'/c calc'!A1` would run on the payroll clerk's machine.
 * Prefixing with a single quote makes the cell literal text.
 */
function neutralize(value: string): string {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

function csvCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const raw = neutralize(String(value));
  // Quote when the cell contains a delimiter, quote, or newline; double any
  // embedded quotes (RFC 4180).
  return /[",\r\n]/.test(raw) ? `"${raw.replaceAll('"', '""')}"` : raw;
}

export function renderPayrollCsv(run: PayrollRunBundle): string {
  const rows = [COLUMNS.join(",")];
  for (const line of run.lines) {
    rows.push(
      [
        csvCell(line.worker.externalEmployeeId),
        csvCell(line.worker.name),
        csvCell(line.earningCode),
        csvCell(line.hours.toFixed(2)),
        csvCell(line.classification),
        csvCell(line.costCenter),
        csvCell(run.periodStart),
        csvCell(run.periodEnd),
        csvCell(run.weekEnding),
      ].join(","),
    );
  }
  // Trailing newline: some importers drop the last record without one.
  return `${rows.join("\r\n")}\r\n`;
}

/** Stable, readable filename. The idempotency key makes a re-export
 *  distinguishable from the original on the clerk's disk. */
export function payrollCsvFilename(run: PayrollRunBundle, idempotencyKey: string): string {
  const slug = (run.projectName ?? run.orgName ?? "payroll")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return `payroll-${slug}-${run.weekEnding}-${idempotencyKey.slice(0, 8)}.csv`;
}

export class CsvPayrollDriver implements PayrollExportDriver {
  readonly provider = "csv";
  readonly capabilities = {
    // It hands back a file; a human or an SFTP transport delivers it.
    push: false,
    // Nothing to poll — the provider never told us anything.
    poll: false,
    // Per-line outcomes are unknowable for a file drop, so a retry is a
    // whole new file rather than a targeted re-send.
    partialRetry: false,
  };

  async validate(run: PayrollRunBundle): Promise<ValidationIssue[]> {
    // The shared rules are the whole of it: a CSV imposes no schema of its
    // own beyond having someone to pay and hours to pay them for.
    return validateBundle(run);
  }

  async export(run: PayrollRunBundle, idempotencyKey: string): Promise<ExportResult> {
    const blocking = (await this.validate(run)).filter((i) => i.blocking);
    if (blocking.length > 0) {
      return {
        state: "failed",
        lines: run.lines.map((l) => ({ id: l.id, state: "queued" as const })),
        error: blocking.map((i) => i.message).join(" "),
      };
    }

    return {
      state: "sent",
      externalBatchId: null,
      // 'queued', not 'accepted': the file exists, but nobody has confirmed
      // a single line of it. Claiming otherwise would let an operator
      // believe hours are paid that no provider has seen.
      lines: run.lines.map((l) => ({ id: l.id, state: "queued" as const })),
      artifact: {
        filename: payrollCsvFilename(run, idempotencyKey),
        contentType: "text/csv; charset=utf-8",
        body: renderPayrollCsv(run),
      },
    };
  }

  async reconcile(_externalBatchId: string): Promise<ReconcileResult> {
    // A file drop has no back-channel. Confirmation is the operator's to
    // record once their provider reports, not something to invent here.
    throw new Error(
      "The CSV driver cannot reconcile: a file drop has no back-channel. Confirm the export manually once your provider reports.",
    );
  }
}
