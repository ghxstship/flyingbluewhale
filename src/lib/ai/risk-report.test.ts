/**
 * Competitive-scan 2026-07 delta — AI project risk reports.
 *
 * Guards the report_data contract between the generator (runAI output),
 * the ai_risk_reports jsonb column, and the RiskReportCard renderer. A row
 * that fails this schema is silently treated as "no report" by
 * getLatestRiskReport, so schema drift here would blank the card — keep the
 * shape locked.
 */
import { describe, it, expect } from "vitest";
import { RiskReportSchema, RISK_OVERALL, RISK_SEVERITIES } from "./risk-report";

const VALID = {
  overall: "high",
  headline: "Show date in 9 days with 14 overdue tasks and a 12% budget overrun.",
  risks: [
    {
      title: "Overdue work compressing into show week",
      severity: "high",
      area: "schedule",
      evidence: "14 of 41 open tasks are overdue with 9 days to start.",
      mitigation: "Triage the overdue list today; move non-blocking items past show day.",
    },
  ],
  watchlist: ["3 assignments untouched for over 7 days"],
};

describe("RiskReportSchema", () => {
  it("accepts a well-formed report", () => {
    const parsed = RiskReportSchema.safeParse(VALID);
    expect(parsed.success).toBe(true);
  });

  it("accepts a healthy report with empty risks and watchlist", () => {
    const parsed = RiskReportSchema.safeParse({
      overall: "low",
      headline: "Signals are quiet — nothing overdue, budget on plan.",
      risks: [],
      watchlist: [],
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects unknown overall grades and severities", () => {
    expect(RiskReportSchema.safeParse({ ...VALID, overall: "severe" }).success).toBe(false);
    expect(
      RiskReportSchema.safeParse({
        ...VALID,
        risks: [{ ...VALID.risks[0], severity: "critical" }],
      }).success,
    ).toBe(false);
  });

  it("rejects a report missing mitigation (the card renders it unconditionally)", () => {
    const { mitigation: _drop, ...rest } = VALID.risks[0]!;
    expect(RiskReportSchema.safeParse({ ...VALID, risks: [rest] }).success).toBe(false);
  });

  it("keeps the enum tuples in sync with the schema", () => {
    for (const o of RISK_OVERALL) {
      expect(RiskReportSchema.safeParse({ ...VALID, overall: o }).success).toBe(true);
    }
    for (const s of RISK_SEVERITIES) {
      expect(
        RiskReportSchema.safeParse({ ...VALID, risks: [{ ...VALID.risks[0], severity: s }] }).success,
      ).toBe(true);
    }
  });
});
