import { describe, expect, it } from "vitest";
import { buildPayrollLines, totalLineHours, type PayrollLineEntry } from "./payroll-lines";

/** An 8h punch on the given date. */
function shift(id: string, date: string, hours = 8): PayrollLineEntry {
  return { id, started_at: `${date}T08:00:00Z`, duration_minutes: hours * 60 };
}

const base = { userId: "u1", workerName: "M. Chen", classification: "Rigger" };

describe("buildPayrollLines", () => {
  it("emits one REG line for a plain week", () => {
    const lines = buildPayrollLines({
      ...base,
      ruleSet: "flsa",
      entries: [shift("a", "2026-03-02"), shift("b", "2026-03-03")],
    });
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatchObject({ code: "REG", hours_st: 16, hours_ot: 0, hours_dt: 0 });
  });

  it("splits a 45h FLSA week into REG + OT lines", () => {
    const entries = ["2026-03-02", "2026-03-03", "2026-03-04", "2026-03-05", "2026-03-06"].map((d, i) =>
      shift(String(i), d, 9),
    );
    const lines = buildPayrollLines({ ...base, ruleSet: "flsa", entries });
    expect(lines.map((l) => l.code)).toEqual(["REG", "OT"]);
    expect(lines[0]?.hours_st).toBe(40);
    expect(lines[1]?.hours_ot).toBe(5);
    expect(totalLineHours(lines)).toBe(45);
  });

  it("emits a DT line under California rules for a 14h day", () => {
    const lines = buildPayrollLines({
      ...base,
      ruleSet: "ca",
      entries: [shift("a", "2026-03-02", 14)],
    });
    expect(lines.map((l) => l.code)).toEqual(["REG", "OT", "DT"]);
    expect(lines.find((l) => l.code === "DT")?.hours_dt).toBe(2);
    expect(totalLineHours(lines)).toBe(14);
  });

  it("emits a single REG line under `none` — the HR system splits it", () => {
    const lines = buildPayrollLines({
      ...base,
      ruleSet: "none",
      entries: [shift("a", "2026-03-02", 14)],
    });
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatchObject({ code: "REG", hours_st: 14 });
  });

  // A zero-hour line imports as a paid-nothing record on the provider's
  // side; returning nothing is the correct, honest answer.
  it("returns no lines when there is nothing payable, rather than a zero line", () => {
    expect(buildPayrollLines({ ...base, ruleSet: "flsa", entries: [] })).toEqual([]);
    expect(
      buildPayrollLines({
        ...base,
        ruleSet: "flsa",
        entries: [{ id: "open", started_at: "2026-03-02T08:00:00Z", duration_minutes: null }],
      }),
    ).toEqual([]);
  });

  it("ignores open punches but still counts the closed ones", () => {
    const lines = buildPayrollLines({
      ...base,
      ruleSet: "flsa",
      entries: [shift("a", "2026-03-02"), { id: "open", started_at: "2026-03-03T08:00:00Z", duration_minutes: null }],
    });
    expect(totalLineHours(lines)).toBe(8);
    expect(lines[0]?.source_entry_ids).toEqual(["a"]);
  });

  it("carries lineage — every line names the punches behind it", () => {
    const lines = buildPayrollLines({
      ...base,
      ruleSet: "flsa",
      entries: [shift("a", "2026-03-02", 9), shift("b", "2026-03-03", 9), shift("c", "2026-03-04", 9),
                shift("d", "2026-03-05", 9), shift("e", "2026-03-06", 9)],
    });
    for (const l of lines) {
      expect(l.source_entry_ids).toEqual(["a", "b", "c", "d", "e"]);
    }
  });

  it("defaults an absent classification honestly rather than inventing one", () => {
    const lines = buildPayrollLines({
      userId: "u1",
      workerName: null,
      ruleSet: "flsa",
      entries: [shift("a", "2026-03-02")],
    });
    expect(lines[0]?.classification).toBe("Unclassified");
  });

  it("applies the weekly threshold per workweek across a biweekly period", () => {
    // 10 consecutive days x 5h = 50h. As one span FLSA would show 10h OT;
    // per workweek it is 25h + 25h, so none.
    const entries = Array.from({ length: 10 }, (_, i) =>
      shift(String(i), new Date(Date.UTC(2026, 2, 1 + i)).toISOString().slice(0, 10), 5),
    );
    const lines = buildPayrollLines({ ...base, ruleSet: "flsa", entries });
    expect(lines.map((l) => l.code)).toEqual(["REG"]);
    expect(totalLineHours(lines)).toBe(50);
  });

  it("conserves hours — lines always total the hours worked", () => {
    for (const rs of ["flsa", "ca", "none"] as const) {
      const entries = [shift("a", "2026-03-02", 13), shift("b", "2026-03-03", 9), shift("c", "2026-03-04", 8)];
      expect(totalLineHours(buildPayrollLines({ ...base, ruleSet: rs, entries })), rs).toBe(30);
    }
  });
});
