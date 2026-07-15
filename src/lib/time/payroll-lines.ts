import { dailyHoursFromEntries, splitPeriodOvertime, type OtRuleSet } from "./overtime";

/**
 * Turn an approved timesheet's entries into payroll lines.
 *
 * Pure, so the hour arithmetic that decides what someone is paid can be
 * tested without a database.
 *
 * One line per earning code with non-zero hours, NOT one per punch: payroll
 * providers import hours-by-code, and a line per punch would both bloat the
 * import and lose the overtime split (which is a property of the week, not
 * of any single punch).
 */

export type PayrollLineEntry = {
  id: string;
  started_at: string;
  duration_minutes: number | null;
};

export type PayrollLineInput = {
  userId: string;
  workerName: string | null;
  /** Trade/classification. Certified payroll requires it; default is honest. */
  classification?: string | null;
  entries: PayrollLineEntry[];
  ruleSet: OtRuleSet;
  /** IANA zone the worker's days are measured in. */
  timeZone?: string;
  /** 0=Sunday … 6=Saturday. */
  weekStartsOn?: number;
};

export type PayrollLine = {
  code: "REG" | "OT" | "DT";
  user_id: string;
  worker_name: string | null;
  classification: string;
  hours_st: number;
  hours_ot: number;
  hours_dt: number;
  source_entry_ids: string[];
};

const DEFAULT_CLASSIFICATION = "Unclassified";

/**
 * Build the payroll lines for one worker on one timesheet.
 *
 * Returns [] when there are no countable hours — an empty result is
 * correct and must not be papered over with a zero-hour line, which would
 * import as a paid-nothing record on the provider's side.
 */
export function buildPayrollLines(input: PayrollLineInput): PayrollLine[] {
  // Open punches carry no duration and are not payable yet.
  const countable = input.entries.filter((e) => e.duration_minutes != null);
  if (countable.length === 0) return [];

  const days = dailyHoursFromEntries(countable, input.timeZone ?? "UTC");
  const split = splitPeriodOvertime(days, input.ruleSet, input.weekStartsOn ?? 0);

  const base = {
    user_id: input.userId,
    worker_name: input.workerName,
    classification: input.classification?.trim() || DEFAULT_CLASSIFICATION,
    source_entry_ids: countable.map((e) => e.id),
  };

  const lines: PayrollLine[] = [];
  if (split.regular > 0) {
    lines.push({ ...base, code: "REG", hours_st: split.regular, hours_ot: 0, hours_dt: 0 });
  }
  if (split.overtime > 0) {
    lines.push({ ...base, code: "OT", hours_st: 0, hours_ot: split.overtime, hours_dt: 0 });
  }
  if (split.doubletime > 0) {
    lines.push({ ...base, code: "DT", hours_st: 0, hours_ot: 0, hours_dt: split.doubletime });
  }
  return lines;
}

/** Total hours across built lines — the reconciliation check before posting. */
export function totalLineHours(lines: PayrollLine[]): number {
  const t = lines.reduce((s, l) => s + l.hours_st + l.hours_ot + l.hours_dt, 0);
  return Math.round(t * 100) / 100;
}
