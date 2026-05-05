import { describe, it, expect } from "vitest";
import { evaluateCondition, type Condition, type ConditionContext } from "../automations/conditions";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function ctx(trigger: Record<string, unknown> = {}, steps: Array<{ output: unknown }> = []): ConditionContext {
  return { trigger, steps };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("evaluateCondition", () => {
  it("returns true for null condition (vacuous)", () => {
    expect(evaluateCondition(null, ctx())).toBe(true);
  });

  it("returns true for undefined condition (vacuous)", () => {
    expect(evaluateCondition(undefined, ctx())).toBe(true);
  });

  // -------------------------------------------------------------------------
  // eq / neq
  // -------------------------------------------------------------------------

  it("eq matches strings", () => {
    expect(evaluateCondition({ field: "trigger.name", op: "eq", value: "alice" }, ctx({ name: "alice" }))).toBe(true);
    expect(evaluateCondition({ field: "trigger.name", op: "eq", value: "alice" }, ctx({ name: "bob" }))).toBe(false);
  });

  it("eq uses strict equality (does not match different types loosely)", () => {
    expect(evaluateCondition({ field: "trigger.n", op: "eq", value: "1" }, ctx({ n: 1 }))).toBe(false);
    expect(evaluateCondition({ field: "trigger.n", op: "eq", value: 1 }, ctx({ n: 1 }))).toBe(true);
  });

  it("neq inverts eq", () => {
    expect(evaluateCondition({ field: "trigger.name", op: "neq", value: "alice" }, ctx({ name: "bob" }))).toBe(true);
    expect(evaluateCondition({ field: "trigger.name", op: "neq", value: "alice" }, ctx({ name: "alice" }))).toBe(false);
  });

  // -------------------------------------------------------------------------
  // gt / gte / lt / lte
  // -------------------------------------------------------------------------

  it("gt on numbers", () => {
    expect(evaluateCondition({ field: "trigger.age", op: "gt", value: 18 }, ctx({ age: 21 }))).toBe(true);
    expect(evaluateCondition({ field: "trigger.age", op: "gt", value: 18 }, ctx({ age: 18 }))).toBe(false);
  });

  it("gt coerces numeric strings to numbers", () => {
    expect(evaluateCondition({ field: "trigger.age", op: "gt", value: 18 }, ctx({ age: "21" }))).toBe(true);
  });

  it("gte includes equal", () => {
    expect(evaluateCondition({ field: "trigger.n", op: "gte", value: 5 }, ctx({ n: 5 }))).toBe(true);
    expect(evaluateCondition({ field: "trigger.n", op: "gte", value: 5 }, ctx({ n: 4 }))).toBe(false);
  });

  it("lt on numbers", () => {
    expect(evaluateCondition({ field: "trigger.n", op: "lt", value: 10 }, ctx({ n: 5 }))).toBe(true);
    expect(evaluateCondition({ field: "trigger.n", op: "lt", value: 10 }, ctx({ n: 10 }))).toBe(false);
  });

  it("lte includes equal", () => {
    expect(evaluateCondition({ field: "trigger.n", op: "lte", value: 10 }, ctx({ n: 10 }))).toBe(true);
  });

  it("gt on dates (ISO strings)", () => {
    expect(evaluateCondition({ field: "trigger.due", op: "gt", value: "2026-01-01" }, ctx({ due: "2026-06-01" }))).toBe(
      true,
    );
    expect(evaluateCondition({ field: "trigger.due", op: "gt", value: "2026-01-01" }, ctx({ due: "2025-12-31" }))).toBe(
      false,
    );
  });

  it("gt returns false when one side is missing", () => {
    expect(evaluateCondition({ field: "trigger.missing", op: "gt", value: 1 }, ctx({}))).toBe(false);
  });

  // -------------------------------------------------------------------------
  // contains / not_contains / starts_with / ends_with
  // -------------------------------------------------------------------------

  it("contains on string", () => {
    expect(
      evaluateCondition({ field: "trigger.title", op: "contains", value: "load" }, ctx({ title: "load-in plan" })),
    ).toBe(true);
    expect(
      evaluateCondition({ field: "trigger.title", op: "contains", value: "strike" }, ctx({ title: "load-in plan" })),
    ).toBe(false);
  });

  it("contains on array (membership)", () => {
    expect(
      evaluateCondition({ field: "trigger.tags", op: "contains", value: "vip" }, ctx({ tags: ["vip", "comp"] })),
    ).toBe(true);
    expect(
      evaluateCondition({ field: "trigger.tags", op: "contains", value: "press" }, ctx({ tags: ["vip", "comp"] })),
    ).toBe(false);
  });

  it("not_contains inverts contains", () => {
    expect(
      evaluateCondition(
        { field: "trigger.title", op: "not_contains", value: "strike" },
        ctx({ title: "load-in plan" }),
      ),
    ).toBe(true);
  });

  it("starts_with / ends_with on strings", () => {
    expect(
      evaluateCondition({ field: "trigger.code", op: "starts_with", value: "MMW" }, ctx({ code: "MMW26-001" })),
    ).toBe(true);
    expect(
      evaluateCondition({ field: "trigger.code", op: "ends_with", value: "001" }, ctx({ code: "MMW26-001" })),
    ).toBe(true);
    expect(
      evaluateCondition({ field: "trigger.code", op: "ends_with", value: "999" }, ctx({ code: "MMW26-001" })),
    ).toBe(false);
  });

  // -------------------------------------------------------------------------
  // in / not_in
  // -------------------------------------------------------------------------

  it("in matches array operand", () => {
    expect(
      evaluateCondition({ field: "trigger.status", op: "in", value: ["draft", "review"] }, ctx({ status: "review" })),
    ).toBe(true);
    expect(
      evaluateCondition(
        { field: "trigger.status", op: "in", value: ["draft", "review"] },
        ctx({ status: "published" }),
      ),
    ).toBe(false);
  });

  it("in returns false when operand is not an array", () => {
    expect(
      evaluateCondition(
        { field: "trigger.status", op: "in", value: "review" as unknown as string[] },
        ctx({ status: "review" }),
      ),
    ).toBe(false);
  });

  it("not_in inverts in", () => {
    expect(
      evaluateCondition(
        { field: "trigger.status", op: "not_in", value: ["draft", "review"] },
        ctx({ status: "published" }),
      ),
    ).toBe(true);
  });

  // -------------------------------------------------------------------------
  // is_empty / is_not_empty
  // -------------------------------------------------------------------------

  it("is_empty matches null/undefined/''/[]/{}", () => {
    const op = "is_empty" as const;
    expect(evaluateCondition({ field: "trigger.x", op }, ctx({ x: null }))).toBe(true);
    expect(evaluateCondition({ field: "trigger.x", op }, ctx({ x: undefined }))).toBe(true);
    expect(evaluateCondition({ field: "trigger.x", op }, ctx({ x: "" }))).toBe(true);
    expect(evaluateCondition({ field: "trigger.x", op }, ctx({ x: [] }))).toBe(true);
    expect(evaluateCondition({ field: "trigger.x", op }, ctx({ x: {} }))).toBe(true);
    expect(evaluateCondition({ field: "trigger.x", op }, ctx({ x: "hi" }))).toBe(false);
    expect(evaluateCondition({ field: "trigger.x", op }, ctx({ x: 0 }))).toBe(false);
  });

  it("is_empty returns true for missing path (vacuous)", () => {
    expect(evaluateCondition({ field: "trigger.never.set", op: "is_empty" }, ctx({}))).toBe(true);
  });

  it("is_not_empty inverts is_empty", () => {
    expect(evaluateCondition({ field: "trigger.x", op: "is_not_empty" }, ctx({ x: "hi" }))).toBe(true);
    expect(evaluateCondition({ field: "trigger.x", op: "is_not_empty" }, ctx({ x: "" }))).toBe(false);
  });

  // -------------------------------------------------------------------------
  // is_true / is_false
  // -------------------------------------------------------------------------

  it("is_true / is_false match strict booleans", () => {
    expect(evaluateCondition({ field: "trigger.flag", op: "is_true" }, ctx({ flag: true }))).toBe(true);
    expect(evaluateCondition({ field: "trigger.flag", op: "is_true" }, ctx({ flag: 1 }))).toBe(false);
    expect(evaluateCondition({ field: "trigger.flag", op: "is_false" }, ctx({ flag: false }))).toBe(true);
  });

  // -------------------------------------------------------------------------
  // is_before / is_after
  // -------------------------------------------------------------------------

  it("is_before / is_after on ISO dates", () => {
    expect(
      evaluateCondition({ field: "trigger.due", op: "is_before", value: "2026-06-01" }, ctx({ due: "2026-05-15" })),
    ).toBe(true);
    expect(
      evaluateCondition({ field: "trigger.due", op: "is_after", value: "2026-06-01" }, ctx({ due: "2026-07-01" })),
    ).toBe(true);
    expect(
      evaluateCondition({ field: "trigger.due", op: "is_after", value: "2026-06-01" }, ctx({ due: "not-a-date" })),
    ).toBe(false);
  });

  // -------------------------------------------------------------------------
  // matches (regex)
  // -------------------------------------------------------------------------

  it("matches with regex string", () => {
    expect(
      evaluateCondition({ field: "trigger.email", op: "matches", value: "^.+@.+\\..+$" }, ctx({ email: "x@y.com" })),
    ).toBe(true);
    expect(
      evaluateCondition({ field: "trigger.email", op: "matches", value: "^.+@.+\\..+$" }, ctx({ email: "broken" })),
    ).toBe(false);
  });

  it("matches with RegExp instance", () => {
    expect(
      evaluateCondition({ field: "trigger.code", op: "matches", value: /^[A-Z]{3}\d+$/ }, ctx({ code: "MMW26" })),
    ).toBe(true);
  });

  it("matches returns false on invalid regex string", () => {
    expect(
      evaluateCondition({ field: "trigger.x", op: "matches", value: "[unterminated" }, ctx({ x: "anything" })),
    ).toBe(false);
  });

  // -------------------------------------------------------------------------
  // all / any groups
  // -------------------------------------------------------------------------

  it("all{eq, gt} requires both", () => {
    const cond: Condition = {
      all: [
        { field: "trigger.name", op: "eq", value: "alice" },
        { field: "trigger.age", op: "gt", value: 18 },
      ],
    };
    expect(evaluateCondition(cond, ctx({ name: "alice", age: 21 }))).toBe(true);
    expect(evaluateCondition(cond, ctx({ name: "alice", age: 17 }))).toBe(false);
    expect(evaluateCondition(cond, ctx({ name: "bob", age: 21 }))).toBe(false);
  });

  it("any{eq, gt} requires either", () => {
    const cond: Condition = {
      any: [
        { field: "trigger.name", op: "eq", value: "alice" },
        { field: "trigger.age", op: "gt", value: 18 },
      ],
    };
    expect(evaluateCondition(cond, ctx({ name: "alice", age: 17 }))).toBe(true);
    expect(evaluateCondition(cond, ctx({ name: "bob", age: 21 }))).toBe(true);
    expect(evaluateCondition(cond, ctx({ name: "bob", age: 17 }))).toBe(false);
  });

  it("empty all{} is true (vacuous AND), empty any{} is false (vacuous OR)", () => {
    expect(evaluateCondition({ all: [] }, ctx({}))).toBe(true);
    expect(evaluateCondition({ any: [] }, ctx({}))).toBe(false);
  });

  it("nested all/any", () => {
    // Evaluates to: status=published AND (priority='p1' OR escalated=true)
    const cond: Condition = {
      all: [
        { field: "trigger.status", op: "eq", value: "published" },
        {
          any: [
            { field: "trigger.priority", op: "eq", value: "p1" },
            { field: "trigger.escalated", op: "is_true" },
          ],
        },
      ],
    };
    expect(evaluateCondition(cond, ctx({ status: "published", priority: "p1", escalated: false }))).toBe(true);
    expect(evaluateCondition(cond, ctx({ status: "published", priority: "p3", escalated: true }))).toBe(true);
    expect(evaluateCondition(cond, ctx({ status: "draft", priority: "p1", escalated: true }))).toBe(false);
    expect(evaluateCondition(cond, ctx({ status: "published", priority: "p3", escalated: false }))).toBe(false);
  });

  // -------------------------------------------------------------------------
  // Path resolution
  // -------------------------------------------------------------------------

  it("walks step output via field path", () => {
    const cond: Condition = { field: "step.0.output.id", op: "eq", value: "abc" };
    expect(evaluateCondition(cond, ctx({}, [{ output: { id: "abc" } }]))).toBe(true);
    expect(evaluateCondition(cond, ctx({}, [{ output: { id: "xyz" } }]))).toBe(false);
  });

  it("walks deeply nested trigger paths", () => {
    expect(
      evaluateCondition(
        { field: "trigger.record.fields.title", op: "eq", value: "Hialeah" },
        ctx({ record: { fields: { title: "Hialeah" } } }),
      ),
    ).toBe(true);
  });

  it("supports bracket notation with quoted keys", () => {
    expect(
      evaluateCondition(
        { field: "trigger.record['weird key'].id", op: "eq", value: 7 },
        ctx({ record: { "weird key": { id: 7 } } }),
      ),
    ).toBe(true);
  });

  it("handles missing field path safely (returns false for most ops)", () => {
    expect(evaluateCondition({ field: "trigger.never.set", op: "eq", value: "x" }, ctx({}))).toBe(false);
    expect(evaluateCondition({ field: "trigger.never.set", op: "gt", value: 5 }, ctx({}))).toBe(false);
    expect(evaluateCondition({ field: "trigger.never.set", op: "contains", value: "x" }, ctx({}))).toBe(false);
  });

  it("handles unknown root segment (returns false / true for is_empty)", () => {
    expect(evaluateCondition({ field: "bogus.path", op: "eq", value: "x" }, ctx({}))).toBe(false);
    expect(evaluateCondition({ field: "bogus.path", op: "is_empty" }, ctx({}))).toBe(true);
  });

  // -------------------------------------------------------------------------
  // Misc edge cases
  // -------------------------------------------------------------------------

  it("eq matches null operand against null field", () => {
    expect(evaluateCondition({ field: "trigger.x", op: "eq", value: null }, ctx({ x: null }))).toBe(true);
  });

  it("contains returns false when both sides are non-string non-array", () => {
    expect(evaluateCondition({ field: "trigger.x", op: "contains", value: 1 }, ctx({ x: 12345 }))).toBe(false);
  });

  it("starts_with returns false when field is not a string", () => {
    expect(evaluateCondition({ field: "trigger.x", op: "starts_with", value: "1" }, ctx({ x: 1234 }))).toBe(false);
  });
});
