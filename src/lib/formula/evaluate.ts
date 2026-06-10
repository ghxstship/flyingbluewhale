import type { EvalContext, Expr, Value } from "./types";

/**
 * Tree-walking evaluator. Pure: no IO, no async, no globals beyond `Date.now()`
 * (and even that is overridable via `ctx.now`). Errors don't throw — they
 * return as `{ type: "error", message }` so a single bad cell doesn't break
 * the row.
 *
 * Function library — Phase 7.1 v1 covers 12 functions. Listed below by category.
 */
export function evaluate(expr: Expr, ctx: EvalContext): Value {
  try {
    return walk(expr, ctx);
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

function err(message: string): Value {
  return { type: "error", message };
}
const NULL: Value = { type: "null" };

function walk(expr: Expr, ctx: EvalContext): Value {
  switch (expr.kind) {
    case "literal":
      return expr.value;
    case "field": {
      const v = ctx.fields[expr.name];
      return v ?? NULL;
    }
    case "unary": {
      const operand = walk(expr.operand, ctx);
      if (operand.type === "error") return operand;
      if (expr.op === "-") {
        if (operand.type === "null") return NULL;
        if (operand.type === "number") return { type: "number", value: -operand.value };
        return err(`Cannot negate ${operand.type}`);
      }
      return err(`Unknown unary op: ${expr.op}`);
    }
    case "binary":
      return evalBinary(expr.op, walk(expr.left, ctx), walk(expr.right, ctx));
    case "call":
      return evalCall(expr.name, expr.args, ctx);
  }
}

function evalBinary(op: string, l: Value, r: Value): Value {
  if (l.type === "error") return l;
  if (r.type === "error") return r;
  // Null propagation for arithmetic + comparison
  if (l.type === "null" || r.type === "null") {
    if (op === "==" || op === "!=") {
      const eq = l.type === "null" && r.type === "null";
      return { type: "boolean", value: op === "==" ? eq : !eq };
    }
    return NULL;
  }
  switch (op) {
    case "+":
      if (l.type === "number" && r.type === "number") return { type: "number", value: l.value + r.value };
      if (l.type === "text" && r.type === "text") return { type: "text", value: l.value + r.value };
      // Mixed (number+text) — coerce to text and concatenate
      return { type: "text", value: stringifyValue(l) + stringifyValue(r) };
    case "&":
      return { type: "text", value: stringifyValue(l) + stringifyValue(r) };
    case "-":
      if (l.type === "number" && r.type === "number") return { type: "number", value: l.value - r.value };
      if (l.type === "date" && r.type === "date") {
        // Date - Date = days
        const ms = l.value.getTime() - r.value.getTime();
        return { type: "number", value: ms / 86_400_000 };
      }
      return err(`Cannot subtract ${l.type} and ${r.type}`);
    case "*":
      if (l.type === "number" && r.type === "number") return { type: "number", value: l.value * r.value };
      return err(`Cannot multiply ${l.type} and ${r.type}`);
    case "/":
      if (l.type === "number" && r.type === "number") {
        if (r.value === 0) return err("Division by zero");
        return { type: "number", value: l.value / r.value };
      }
      return err(`Cannot divide ${l.type} and ${r.type}`);
    case "==":
    case "!=": {
      const eq = valuesEqual(l, r);
      return { type: "boolean", value: op === "==" ? eq : !eq };
    }
    case "<":
    case "<=":
    case ">":
    case ">=": {
      const cmp = valueCompare(l, r);
      if (cmp === null) return err(`Cannot compare ${l.type} and ${r.type}`);
      const r0 = cmp;
      return {
        type: "boolean",
        value: op === "<" ? r0 < 0 : op === "<=" ? r0 <= 0 : op === ">" ? r0 > 0 : r0 >= 0,
      };
    }
  }
  return err(`Unknown binary op: ${op}`);
}

function valuesEqual(a: Value, b: Value): boolean {
  if (a.type !== b.type) return false;
  if (a.type === "number" && b.type === "number") return a.value === b.value;
  if (a.type === "text" && b.type === "text") return a.value === b.value;
  if (a.type === "boolean" && b.type === "boolean") return a.value === b.value;
  if (a.type === "date" && b.type === "date") return a.value.getTime() === b.value.getTime();
  if (a.type === "null" && b.type === "null") return true;
  return false;
}

function valueCompare(a: Value, b: Value): number | null {
  if (a.type === "number" && b.type === "number") return a.value - b.value;
  if (a.type === "text" && b.type === "text") return a.value < b.value ? -1 : a.value > b.value ? 1 : 0;
  if (a.type === "date" && b.type === "date") return a.value.getTime() - b.value.getTime();
  return null;
}

function stringifyValue(v: Value): string {
  switch (v.type) {
    case "number":
      return String(v.value);
    case "text":
      return v.value;
    case "boolean":
      return v.value ? "true" : "false";
    case "date":
      return v.value.toISOString();
    case "null":
      return "";
    case "error":
      return `#ERROR(${v.message})`;
  }
}

function asNumber(v: Value): number | null {
  if (v.type === "number") return v.value;
  if (v.type === "boolean") return v.value ? 1 : 0;
  if (v.type === "text") {
    const n = Number(v.value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function asDate(v: Value): Date | null {
  if (v.type === "date") return v.value;
  if (v.type === "text") {
    const t = Date.parse(v.value);
    return Number.isFinite(t) ? new Date(t) : null;
  }
  return null;
}

function asBool(v: Value): boolean {
  if (v.type === "boolean") return v.value;
  if (v.type === "null") return false;
  if (v.type === "number") return v.value !== 0;
  if (v.type === "text") return v.value.length > 0;
  if (v.type === "date") return true;
  return false;
}

// ─── Function library ────────────────────────────────────────────────

function evalCall(name: string, args: Expr[], ctx: EvalContext): Value {
  switch (name) {
    case "IF": {
      if (args.length !== 2 && args.length !== 3) return err("IF requires 2 or 3 arguments");
      const cond = walk(args[0]!, ctx);
      if (cond.type === "error") return cond;
      return asBool(cond) ? walk(args[1]!, ctx) : args[2] ? walk(args[2], ctx) : NULL;
    }
    case "AND": {
      if (args.length === 0) return { type: "boolean", value: true };
      for (const a of args) {
        const v = walk(a, ctx);
        if (v.type === "error") return v;
        if (!asBool(v)) return { type: "boolean", value: false };
      }
      return { type: "boolean", value: true };
    }
    case "OR": {
      for (const a of args) {
        const v = walk(a, ctx);
        if (v.type === "error") return v;
        if (asBool(v)) return { type: "boolean", value: true };
      }
      return { type: "boolean", value: false };
    }
    case "NOT": {
      if (args.length !== 1) return err("NOT requires 1 argument");
      const v = walk(args[0]!, ctx);
      if (v.type === "error") return v;
      return { type: "boolean", value: !asBool(v) };
    }
    case "IFERROR": {
      if (args.length !== 2) return err("IFERROR requires 2 arguments");
      const v = walk(args[0]!, ctx);
      return v.type === "error" ? walk(args[1]!, ctx) : v;
    }
    case "CONCAT": {
      let out = "";
      for (const a of args) {
        const v = walk(a, ctx);
        if (v.type === "error") return v;
        out += stringifyValue(v);
      }
      return { type: "text", value: out };
    }
    case "ROUND": {
      if (args.length < 1 || args.length > 2) return err("ROUND requires 1 or 2 arguments");
      const n = asNumber(walk(args[0]!, ctx));
      if (n === null) return err("ROUND: first argument must be a number");
      const digits = args[1] ? (asNumber(walk(args[1], ctx)) ?? 0) : 0;
      const m = Math.pow(10, Math.floor(digits));
      return { type: "number", value: Math.round(n * m) / m };
    }
    case "ABS": {
      if (args.length !== 1) return err("ABS requires 1 argument");
      const n = asNumber(walk(args[0]!, ctx));
      return n === null ? err("ABS: argument must be a number") : { type: "number", value: Math.abs(n) };
    }
    case "TODAY": {
      if (args.length !== 0) return err("TODAY takes no arguments");
      const now = ctx.now ?? new Date();
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      return { type: "date", value: d };
    }
    case "NOW": {
      if (args.length !== 0) return err("NOW takes no arguments");
      return { type: "date", value: new Date((ctx.now ?? new Date()).getTime()) };
    }
    case "DATEDIFF": {
      // DATEDIFF(end, start, unit?) — unit defaults to "days"
      if (args.length < 2 || args.length > 3) return err("DATEDIFF requires 2 or 3 arguments");
      const a = asDate(walk(args[0]!, ctx));
      const b = asDate(walk(args[1]!, ctx));
      if (!a || !b) return err("DATEDIFF: arguments must be dates");
      const unitV = args[2] ? walk(args[2], ctx) : ({ type: "text", value: "days" } as Value);
      const unit = unitV.type === "text" ? unitV.value.toLowerCase() : "days";
      const ms = a.getTime() - b.getTime();
      const factor =
        unit === "seconds"
          ? 1000
          : unit === "minutes"
            ? 60_000
            : unit === "hours"
              ? 3_600_000
              : unit === "days"
                ? 86_400_000
                : unit === "weeks"
                  ? 604_800_000
                  : null;
      if (factor === null) return err(`DATEDIFF: unsupported unit '${unit}'`);
      return { type: "number", value: ms / factor };
    }
    case "DATEADD": {
      // DATEADD(date, n, unit?) — unit defaults to "days"
      if (args.length < 2 || args.length > 3) return err("DATEADD requires 2 or 3 arguments");
      const d = asDate(walk(args[0]!, ctx));
      const n = asNumber(walk(args[1]!, ctx));
      if (!d || n === null) return err("DATEADD: bad arguments");
      const unitV = args[2] ? walk(args[2], ctx) : ({ type: "text", value: "days" } as Value);
      const unit = unitV.type === "text" ? unitV.value.toLowerCase() : "days";
      const factor =
        unit === "seconds"
          ? 1000
          : unit === "minutes"
            ? 60_000
            : unit === "hours"
              ? 3_600_000
              : unit === "days"
                ? 86_400_000
                : unit === "weeks"
                  ? 604_800_000
                  : null;
      if (factor === null) return err(`DATEADD: unsupported unit '${unit}'`);
      return { type: "date", value: new Date(d.getTime() + n * factor) };
    }
    case "SUM":
    case "SUMIF":
    case "AVG":
    case "AVGIF":
    case "COUNT":
    case "COUNTIF":
    case "MIN":
    case "MAX": {
      // Aggregate functions accept varargs of values. Non-numeric/null args
      // are silently skipped (matches SmartSuite semantics for COUNT vs COUNTA).
      // The IF variants take a final predicate arg; for v1 we treat them as
      // their non-IF base — predicate filtering is forward-looking work since
      // it requires range-context the caller doesn't pass yet.
      const vals: number[] = [];
      const isCount = name === "COUNT" || name === "COUNTIF";
      let nonNullSeen = 0;
      for (let i = 0; i < args.length; i++) {
        const v = walk(args[i]!, ctx);
        if (v.type === "error") return v;
        if (v.type === "null") continue;
        nonNullSeen++;
        const n = asNumber(v);
        if (n !== null) vals.push(n);
      }
      if (isCount) return { type: "number", value: nonNullSeen };
      if (vals.length === 0) return NULL;
      if (name === "SUM" || name === "SUMIF") return { type: "number", value: vals.reduce((a, b) => a + b, 0) };
      if (name === "AVG" || name === "AVGIF")
        return { type: "number", value: vals.reduce((a, b) => a + b, 0) / vals.length };
      if (name === "MIN") return { type: "number", value: Math.min(...vals) };
      if (name === "MAX") return { type: "number", value: Math.max(...vals) };
      return err(`Unknown aggregate: ${name}`);
    }
    case "LEN":
    case "LENGTH": {
      if (args.length !== 1) return err("LEN requires 1 argument");
      const v = walk(args[0]!, ctx);
      const s = stringifyValue(v);
      return { type: "number", value: s.length };
    }
    case "UPPER": {
      if (args.length !== 1) return err("UPPER requires 1 argument");
      const v = walk(args[0]!, ctx);
      return { type: "text", value: stringifyValue(v).toUpperCase() };
    }
    case "LOWER": {
      if (args.length !== 1) return err("LOWER requires 1 argument");
      const v = walk(args[0]!, ctx);
      return { type: "text", value: stringifyValue(v).toLowerCase() };
    }
    case "TRIM": {
      if (args.length !== 1) return err("TRIM requires 1 argument");
      const v = walk(args[0]!, ctx);
      return { type: "text", value: stringifyValue(v).trim() };
    }
    case "CONTAINS": {
      if (args.length !== 2) return err("CONTAINS requires 2 arguments");
      const haystack = stringifyValue(walk(args[0]!, ctx));
      const needle = stringifyValue(walk(args[1]!, ctx));
      return { type: "boolean", value: haystack.includes(needle) };
    }
    case "BLANK": {
      return NULL;
    }
    case "ISBLANK":
    case "IS_NOT_NULL": {
      if (args.length !== 1) return err(`${name} requires 1 argument`);
      const v = walk(args[0]!, ctx);
      const blank = v.type === "null" || (v.type === "text" && v.value === "");
      return { type: "boolean", value: name === "ISBLANK" ? blank : !blank };
    }
    default:
      return err(`Unknown function: ${name}`);
  }
}
