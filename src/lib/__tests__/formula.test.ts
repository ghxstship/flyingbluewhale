import { describe, it, expect } from "vitest";
import { run, tokenize, parse, evaluate } from "@/lib/formula";
import type { EvalContext, Value } from "@/lib/formula";

const num = (n: number): Value => ({ type: "number", value: n });
const text = (s: string): Value => ({ type: "text", value: s });
const bool = (b: boolean): Value => ({ type: "boolean", value: b });

describe("tokenize", () => {
  it("number, op, number", () => {
    const t = tokenize("1 + 2");
    expect(t).toEqual([
      { kind: "number", value: 1 },
      { kind: "op", value: "+" },
      { kind: "number", value: 2 },
      { kind: "eof" },
    ]);
  });
  it("string with escapes", () => {
    const t = tokenize('"hi\\nworld"');
    expect(t[0]).toEqual({ kind: "string", value: "hi\nworld" });
  });
  it("field reference", () => {
    const t = tokenize("[Total Amount]");
    expect(t[0]).toEqual({ kind: "field", value: "Total Amount" });
  });
  it("identifiers and parens", () => {
    const t = tokenize("IF(a, b, c)");
    expect(t[0]).toEqual({ kind: "ident", value: "IF" });
    expect(t[1]).toEqual({ kind: "lparen" });
  });
  it("comments are skipped", () => {
    const t = tokenize("# header\n1 + 2");
    expect(t[0]).toEqual({ kind: "number", value: 1 });
  });
});

describe("parse + evaluate basics", () => {
  const ctx: EvalContext = { fields: {} };
  it("number literal", () => {
    expect(run("42", ctx)).toEqual(num(42));
  });
  it("addition", () => {
    expect(run("1 + 2", ctx)).toEqual(num(3));
  });
  it("respects precedence", () => {
    expect(run("1 + 2 * 3", ctx)).toEqual(num(7));
  });
  it("parens override precedence", () => {
    expect(run("(1 + 2) * 3", ctx)).toEqual(num(9));
  });
  it("unary minus", () => {
    expect(run("-5 + 3", ctx)).toEqual(num(-2));
  });
  it("string concat with +", () => {
    expect(run('"hello " + "world"', ctx)).toEqual(text("hello world"));
  });
  it("string concat with &", () => {
    expect(run('"a" & "b" & "c"', ctx)).toEqual(text("abc"));
  });
});

describe("field references", () => {
  it("resolves a field", () => {
    const ctx: EvalContext = { fields: { Amount: num(100) } };
    expect(run("[Amount]", ctx)).toEqual(num(100));
  });
  it("missing field is null", () => {
    const ctx: EvalContext = { fields: {} };
    expect(run("[Missing]", ctx)).toEqual({ type: "null" });
  });
  it("arithmetic on fields", () => {
    const ctx: EvalContext = { fields: { Q: num(50), R: num(25) } };
    expect(run("[Q] - [R]", ctx)).toEqual(num(25));
  });
});

describe("comparisons", () => {
  const ctx: EvalContext = { fields: {} };
  it("eq number", () => {
    expect(run("1 == 1", ctx)).toEqual(bool(true));
  });
  it("neq number", () => {
    expect(run("1 != 2", ctx)).toEqual(bool(true));
  });
  it("eq text", () => {
    expect(run('"a" == "a"', ctx)).toEqual(bool(true));
  });
  it("lt number", () => {
    expect(run("1 < 2", ctx)).toEqual(bool(true));
  });
  it("gte number", () => {
    expect(run("3 >= 3", ctx)).toEqual(bool(true));
  });
  it("= is normalized to ==", () => {
    expect(run("1 = 1", ctx)).toEqual(bool(true));
  });
});

describe("logical", () => {
  const ctx: EvalContext = { fields: {} };
  it("IF true branch", () => {
    expect(run('IF(1 < 2, "yes", "no")', ctx)).toEqual(text("yes"));
  });
  it("IF false branch", () => {
    expect(run('IF(1 > 2, "yes", "no")', ctx)).toEqual(text("no"));
  });
  it("AND short-circuits on false", () => {
    expect(run("AND(TRUE, FALSE, 1/0)", ctx)).toEqual(bool(false));
  });
  it("OR short-circuits on true", () => {
    expect(run("OR(TRUE, 1/0)", ctx)).toEqual(bool(true));
  });
  it("NOT", () => {
    expect(run("NOT(TRUE)", ctx)).toEqual(bool(false));
  });
  it("IFERROR catches errors", () => {
    expect(run('IFERROR(1/0, "oops")', ctx)).toEqual(text("oops"));
  });
});

describe("text functions", () => {
  const ctx: EvalContext = { fields: { Name: text("alice") } };
  it("UPPER", () => {
    expect(run("UPPER([Name])", ctx)).toEqual(text("ALICE"));
  });
  it("LOWER", () => {
    expect(run('LOWER("ABC")', ctx)).toEqual(text("abc"));
  });
  it("TRIM", () => {
    expect(run('TRIM("  hi  ")', ctx)).toEqual(text("hi"));
  });
  it("CONCAT", () => {
    expect(run('CONCAT("a", "b", "c")', ctx)).toEqual(text("abc"));
  });
  it("LEN", () => {
    expect(run('LEN("abcd")', ctx)).toEqual(num(4));
  });
  it("CONTAINS", () => {
    expect(run('CONTAINS("hello world", "ell")', ctx)).toEqual(bool(true));
  });
});

describe("numeric functions", () => {
  const ctx: EvalContext = { fields: {} };
  it("ROUND default", () => {
    expect(run("ROUND(1.567)", ctx)).toEqual(num(2));
  });
  it("ROUND with digits", () => {
    expect(run("ROUND(1.567, 2)", ctx)).toEqual(num(1.57));
  });
  it("ABS", () => {
    expect(run("ABS(-3)", ctx)).toEqual(num(3));
  });
});

describe("date functions", () => {
  const fixedNow = new Date(Date.UTC(2026, 4, 4, 12, 0, 0));
  const ctx: EvalContext = { fields: {}, now: fixedNow };
  it("TODAY returns midnight UTC of `now`", () => {
    const r = run("TODAY()", ctx);
    expect(r.type).toBe("date");
    if (r.type === "date") expect(r.value.toISOString()).toBe("2026-05-04T00:00:00.000Z");
  });
  it("DATEDIFF in days", () => {
    const ctx2: EvalContext = {
      fields: {
        Start: { type: "date", value: new Date(Date.UTC(2026, 4, 1)) },
        End: { type: "date", value: new Date(Date.UTC(2026, 4, 8)) },
      },
    };
    expect(run("DATEDIFF([End], [Start])", ctx2)).toEqual(num(7));
  });
  it("DATEADD days", () => {
    const r = run("DATEADD(TODAY(), 7)", ctx);
    if (r.type !== "date") throw new Error("expected date");
    expect(r.value.toISOString()).toBe("2026-05-11T00:00:00.000Z");
  });
});

describe("aggregate functions", () => {
  const ctx: EvalContext = { fields: {} };
  it("SUM varargs", () => {
    expect(run("SUM(1, 2, 3, 4)", ctx)).toEqual(num(10));
  });
  it("AVG varargs", () => {
    expect(run("AVG(2, 4, 6)", ctx)).toEqual(num(4));
  });
  it("MIN/MAX varargs", () => {
    expect(run("MIN(3, 1, 2)", ctx)).toEqual(num(1));
    expect(run("MAX(3, 1, 2)", ctx)).toEqual(num(3));
  });
  it("COUNT", () => {
    expect(run("COUNT(1, 2, 3)", ctx)).toEqual(num(3));
  });
});

describe("error handling", () => {
  const ctx: EvalContext = { fields: {} };
  it("division by zero", () => {
    const r = run("1/0", ctx);
    expect(r.type).toBe("error");
  });
  it("unknown function", () => {
    const r = run("FOOBAR()", ctx);
    expect(r.type).toBe("error");
  });
  it("syntax error becomes error Value", () => {
    const r = run("1 + ", ctx);
    expect(r.type).toBe("error");
  });
  it("missing field doesn't crash", () => {
    expect(run("[X] + [Y]", ctx)).toEqual({ type: "null" });
  });
  it("evaluator never throws", () => {
    // Pathological input shouldn't crash; should return error Value
    const r = run('1 + "abc"', ctx);
    // String coercion produces "1abc" (text), which is the documented behavior
    expect(r).toEqual(text("1abc"));
  });
});

describe("real-world formulas", () => {
  it("deliverable progress %", () => {
    const ctx: EvalContext = { fields: { Done: num(7), Total: num(10) } };
    expect(run("ROUND([Done] / [Total] * 100, 0)", ctx)).toEqual(num(70));
  });
  it("days until due", () => {
    const ctx: EvalContext = {
      fields: { Due: { type: "date", value: new Date(Date.UTC(2026, 4, 11)) } },
      now: new Date(Date.UTC(2026, 4, 4)),
    };
    expect(run("DATEDIFF([Due], TODAY())", ctx)).toEqual(num(7));
  });
  it("status label via IF", () => {
    const ctx: EvalContext = { fields: { Pct: num(100) } };
    expect(run('IF([Pct] >= 100, "Complete", "In Progress")', ctx)).toEqual(text("Complete"));
  });
  it("invoice number formatter", () => {
    const ctx: EvalContext = { fields: { Year: num(2026), Seq: num(17) } };
    expect(run('CONCAT("INV-", [Year], "-", [Seq])', ctx)).toEqual(text("INV-2026-17"));
  });
});

describe("parse / tokenize edge cases", () => {
  it("nested parens", () => {
    const ctx: EvalContext = { fields: {} };
    expect(run("((1 + 2) * (3 + 4))", ctx)).toEqual(num(21));
  });
  it("nested function calls", () => {
    const ctx: EvalContext = { fields: {} };
    expect(run("ROUND(SUM(1.1, 2.2, 3.3), 1)", ctx)).toEqual(num(6.6));
  });
  it("AST round-trip via parse + evaluate", () => {
    const ast = parse(tokenize("1 + 2"));
    expect(evaluate(ast, { fields: {} })).toEqual(num(3));
  });
});
