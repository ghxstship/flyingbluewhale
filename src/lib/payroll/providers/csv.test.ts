import { describe, expect, it } from "vitest";
import { CsvPayrollDriver, payrollCsvFilename, renderPayrollCsv } from "./csv";
import { validateBundle, type ExportLine, type PayrollRunBundle } from "./types";
import { idempotencyKeyFor, runContentDigest } from "../idempotency";

function line(over: Partial<ExportLine> = {}): ExportLine {
  return {
    id: over.id ?? "l1",
    worker: {
      partyId: "p1",
      userId: "u1",
      name: "M. Chen",
      externalEmployeeId: "E-1001",
      ...(over.worker ?? {}),
    },
    earningCode: over.earningCode ?? "REG",
    hours: over.hours ?? 40,
    classification: over.classification ?? "Rigger",
    costCenter: over.costCenter ?? "5000",
  };
}

function bundle(lines: ExportLine[] = [line()]): PayrollRunBundle {
  return {
    runId: "run-1",
    orgId: "org-1",
    orgName: "Acme Productions",
    projectName: "MMW26 Hialeah",
    periodStart: "2026-03-02",
    periodEnd: "2026-03-08",
    weekEnding: "2026-03-08",
    lines,
  };
}

describe("renderPayrollCsv", () => {
  it("emits a header and one row per line", () => {
    const csv = renderPayrollCsv(bundle([line({ id: "a" }), line({ id: "b", earningCode: "OT", hours: 5 })]));
    const rows = csv.trim().split("\r\n");
    expect(rows).toHaveLength(3);
    expect(rows[0]).toContain("employee_id,employee_name,earning_code,hours");
    expect(rows[1]).toContain("E-1001,M. Chen,REG,40.00");
    expect(rows[2]).toContain("OT,5.00");
  });

  it("quotes cells containing a comma, and doubles embedded quotes", () => {
    const csv = renderPayrollCsv(bundle([line({ worker: { ...line().worker, name: 'Chen, M. "Mo"' } })]));
    expect(csv).toContain('"Chen, M. ""Mo"""');
  });

  it("renders hours to two decimals so a provider never sees 7.000000001", () => {
    expect(renderPayrollCsv(bundle([line({ hours: 7.1 + 0.2 })]))).toContain("7.30");
  });

  it("ends with a newline — some importers drop the last record without one", () => {
    expect(renderPayrollCsv(bundle())).toMatch(/\r\n$/);
  });

  /**
   * Formula injection. Worker names are user-supplied and land in a file a
   * payroll clerk opens in Excel; a cell starting = + - @ executes on open.
   */
  describe("spreadsheet formula injection", () => {
    it("neutralises a formula in a worker name", () => {
      const csv = renderPayrollCsv(bundle([line({ worker: { ...line().worker, name: "=cmd|'/c calc'!A1" } })]));
      // Quoted because of the embedded comma/quote rules, but the payload
      // must not begin with '=' inside the cell.
      expect(csv).toContain("'=cmd");
      expect(csv).not.toMatch(/,=cmd/);
    });

    it("neutralises every dangerous lead character", () => {
      for (const evil of ["=1+1", "+1+1", "-1+1", "@SUM(A1)", "\t=1+1", "\r=1+1"]) {
        const csv = renderPayrollCsv(bundle([line({ classification: evil })]));
        expect(csv, evil).toContain(`'${evil.replace(/^[\t\r]/, (m) => m)}`.slice(0, 3));
      }
    });

    it("leaves an ordinary name untouched", () => {
      expect(renderPayrollCsv(bundle())).toContain("M. Chen");
      expect(renderPayrollCsv(bundle())).not.toContain("'M. Chen");
    });
  });
});

describe("validateBundle", () => {
  it("refuses a run with no lines", () => {
    const issues = validateBundle(bundle([]));
    expect(issues[0]?.code).toBe("no_lines");
    expect(issues[0]?.blocking).toBe(true);
  });

  // The most common reason a payroll import is rejected — caught here
  // rather than at the provider's error endpoint.
  it("refuses a worker with no external employee id", () => {
    const issues = validateBundle(bundle([line({ worker: { ...line().worker, externalEmployeeId: null } })]));
    expect(issues.some((i) => i.code === "unmapped_worker" && i.blocking)).toBe(true);
  });

  it("refuses a zero-hour line rather than importing a paid-nothing record", () => {
    const issues = validateBundle(bundle([line({ hours: 0 })]));
    expect(issues.some((i) => i.code === "zero_hours" && i.blocking)).toBe(true);
  });

  it("passes a well-formed run", () => {
    expect(validateBundle(bundle())).toEqual([]);
  });
});

describe("CsvPayrollDriver", () => {
  const driver = new CsvPayrollDriver();

  it("is honest about what it can do", () => {
    // It hands back a file; it cannot push, poll, or retry a single line.
    expect(driver.capabilities).toEqual({ push: false, poll: false, partialRetry: false });
  });

  it("produces an artifact and marks lines queued, not accepted", () => {
    return driver.export(bundle(), "abc123def456").then((r) => {
      expect(r.state).toBe("sent");
      expect(r.artifact?.contentType).toContain("text/csv");
      expect(r.artifact?.body).toContain("E-1001");
      // Nobody has confirmed a line of it — claiming 'accepted' would let an
      // operator believe hours are paid that no provider has seen.
      expect(r.lines.every((l) => l.state === "queued")).toBe(true);
    });
  });

  it("refuses to produce a file when a worker is unmapped", async () => {
    const r = await driver.export(bundle([line({ worker: { ...line().worker, externalEmployeeId: null } })]), "k");
    expect(r.state).toBe("failed");
    expect(r.artifact).toBeUndefined();
    expect(r.error).toMatch(/employee id/i);
  });

  it("refuses to reconcile rather than inventing an outcome", async () => {
    await expect(driver.reconcile("batch-1")).rejects.toThrow(/no back-channel/i);
  });

  it("names the file so a re-export is distinguishable on disk", () => {
    const name = payrollCsvFilename(bundle(), "abc123def456");
    expect(name).toBe("payroll-mmw26-hialeah-2026-03-08-abc123de.csv");
  });
});

describe("idempotency", () => {
  it("gives unchanged content the same key — a retry must not pay twice", () => {
    expect(idempotencyKeyFor(bundle(), "csv")).toBe(idempotencyKeyFor(bundle(), "csv"));
  });

  it("gives changed hours a different key — a correction is a new payment", () => {
    expect(idempotencyKeyFor(bundle(), "csv")).not.toBe(idempotencyKeyFor(bundle([line({ hours: 41 })]), "csv"));
  });

  it("is order-independent — re-reading the lines sorted differently is the same payment", () => {
    const a = bundle([line({ id: "a" }), line({ id: "b", earningCode: "OT", hours: 5 })]);
    const b = bundle([line({ id: "b", earningCode: "OT", hours: 5 }), line({ id: "a" })]);
    expect(runContentDigest(a)).toBe(runContentDigest(b));
  });

  it("separates providers — the same run to two systems is two payments, not a duplicate", () => {
    expect(idempotencyKeyFor(bundle(), "csv")).not.toBe(idempotencyKeyFor(bundle(), "adp"));
  });

  it("changes when the earning code changes", () => {
    expect(runContentDigest(bundle())).not.toBe(runContentDigest(bundle([line({ earningCode: "OT" })])));
  });

  it("changes when the worker's external id changes", () => {
    expect(runContentDigest(bundle())).not.toBe(
      runContentDigest(bundle([line({ worker: { ...line().worker, externalEmployeeId: "E-9999" } })])),
    );
  });
});
