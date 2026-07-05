import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  deriveDocStatus,
  remainingPct,
  deriveVerdict,
  canTransitionWorkOrder,
  WORK_ORDER_STATES,
  DISPATCH_MODES,
  CHANGE_ORDER_STATES,
  WORK_ORDER_VISIBILITIES,
  EXPIRY_ALERT_DAYS,
} from "./subcontractor";

const NOW = new Date("2026-06-29T12:00:00Z");
const plusDays = (n: number) => {
  const d = new Date(NOW);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

describe("compliance doc-status derivation (mirrors v_compliance_doc_status)", () => {
  it("null expiry is always current at full life", () => {
    expect(deriveDocStatus(null, NOW)).toBe("current");
    expect(remainingPct(null, NOW)).toBe(100);
  });
  it("past expiry is expired at 0%", () => {
    expect(deriveDocStatus(plusDays(-1), NOW)).toBe("expired");
    expect(remainingPct(plusDays(-1), NOW)).toBe(0);
  });
  it("within the alert window is expiring", () => {
    expect(deriveDocStatus(plusDays(EXPIRY_ALERT_DAYS - 1), NOW)).toBe("expiring");
    expect(deriveDocStatus(plusDays(1), NOW)).toBe("expiring");
  });
  it("beyond the window is current", () => {
    expect(deriveDocStatus(plusDays(EXPIRY_ALERT_DAYS + 5), NOW)).toBe("current");
    expect(remainingPct(plusDays(EXPIRY_ALERT_DAYS), NOW)).toBe(100);
  });
});

describe("eligibility verdict (mirrors v_sub_eligibility)", () => {
  it("blocked when any required doc is missing or expired", () => {
    expect(deriveVerdict([{ kind: "coi", status: "current" }, { kind: "w9", status: "missing" }])).toBe("blocked");
    expect(deriveVerdict([{ kind: "license", status: "expired" }])).toBe("blocked");
  });
  it("expiring when any is in the window and none blocked", () => {
    expect(deriveVerdict([{ kind: "coi", status: "current" }, { kind: "license", status: "expiring" }])).toBe(
      "expiring",
    );
  });
  it("eligible when all current", () => {
    expect(deriveVerdict([{ kind: "coi", status: "current" }, { kind: "w9", status: "current" }])).toBe("eligible");
  });
  it("eligible (vacuously) when no requirements", () => {
    expect(deriveVerdict([])).toBe("eligible");
  });
});

describe("work-order transition map", () => {
  it("allows the canonical forward path", () => {
    expect(canTransitionWorkOrder("draft", "posted")).toBe(true);
    expect(canTransitionWorkOrder("awarded", "in-progress")).toBe(true);
    expect(canTransitionWorkOrder("approved", "invoiced")).toBe(true);
  });
  it("rejects illegal jumps", () => {
    expect(canTransitionWorkOrder("draft", "invoiced")).toBe(false);
    expect(canTransitionWorkOrder("closed", "draft")).toBe(false);
  });
});

/**
 * SSOT lock: the TS tuples must match the DB CHECK constraints in the migration.
 * If a state is added in SQL but not here (or vice-versa), this fails — the
 * client and the database can't silently fork.
 */
describe("enum tuples ↔ migration CHECK constraints", () => {
  const sql = readFileSync(
    join(process.cwd(), "supabase/migrations/20260629191356_subcontractor_ops_p1.sql"),
    "utf8",
  );
  const checkList = (col: string): string[] => {
    const m = sql.match(new RegExp(`${col} in\\s*\\(([^)]*)\\)`, "s"));
    if (!m) throw new Error(`no CHECK found for ${col}`);
    return [...m[1]!.matchAll(/'([^']+)'/g)].map((x) => x[1]!).sort();
  };
  it("work_order_state", () => {
    expect(checkList("work_order_state")).toEqual([...WORK_ORDER_STATES].sort());
  });
  it("dispatch_mode", () => {
    expect(checkList("dispatch_mode")).toEqual([...DISPATCH_MODES].sort());
  });
  it("change_order_state", () => {
    expect(checkList("change_order_state")).toEqual([...CHANGE_ORDER_STATES].sort());
  });
  it("visibility", () => {
    expect(checkList("visibility")).toEqual([...WORK_ORDER_VISIBILITIES].sort());
  });
});
