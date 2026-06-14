/**
 * Condition evaluator — Phase 4.5 of the SmartSuite parity roadmap.
 *
 * A small JSON DSL mirroring SmartSuite's per-field-type operator set. Used
 * by the runner to gate each step ("Run when…"), and by triggers/conditions
 * authored against `domain_events` rows. Hand-rolled rather than pulling in
 * jsonlogic — the operator surface is small enough that a third-party dep
 * is more risk than reward (CVE exposure, drift between SmartSuite docs and
 * library behaviour, JSON-shape lock-in).
 *
 * Per [SmartSuite Automation Conditions](https://help.smartsuite.com/en/articles/6464896-automation-conditions).
 *
 * Pure function — no I/O, no globals, no DB access. Trivially unit-testable
 * (see `src/lib/__tests__/automation-conditions.test.ts`).
 *
 * Shape:
 *
 *   { all: [Condition, ...] }     // AND
 *   { any: [Condition, ...] }     // OR
 *   { field: string, op: ConditionOp, value?: unknown }   // leaf rule
 *
 * Groups can nest arbitrarily. `evaluateCondition(undefined, ctx)` and
 * `evaluateCondition(null, ctx)` both return `true` (vacuous — a step with
 * no condition always runs).
 *
 * Field paths use the same dot/bracket notation as `resolveTemplate` so
 * authors can copy-paste between the two:
 *   - `trigger.greeting`
 *   - `trigger.record.fields.title`
 *   - `step.0.output.received.value`
 *   - `steps[1].output.id`
 */

export type ConditionOp =
  // text/number/bool — strict equality
  | "eq"
  | "neq"
  // number/date — ordering
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  // text — substring
  | "contains"
  | "not_contains"
  | "starts_with"
  | "ends_with"
  // text/number — set membership; `value` must be an array
  | "in"
  | "not_in"
  // any — emptiness
  | "is_empty"
  | "is_not_empty"
  // boolean — truthiness shortcuts
  | "is_true"
  | "is_false"
  // date — alias of gt/lt that prefers ISO parsing
  | "is_before"
  | "is_after"
  // text — regex
  | "matches";

export type ConditionRule = {
  /** Path into ctx (e.g. `trigger.foo.bar`, `step.0.output.id`). */
  field: string;
  op: ConditionOp;
  /** Operand. Compared against the resolved field value. Optional for
   *  ops that take no operand (`is_empty`, `is_not_empty`, `is_true`,
   *  `is_false`). */
  value?: unknown;
};

// ---------------------------------------------------------------------------
// Operator registry — single source of truth for the editor UI. Mirrors the
// action-registry pattern (`registry.ts`): an ordered tuple of every op, a
// human label map, and a set of the ops that take no operand. The StepCard
// condition editor renders its operator `<select>` from `CONDITION_OPS` and
// hides the value input for `NULLARY_OPS`, so adding an op here automatically
// surfaces it in the UI — no second list to keep in sync.
// ---------------------------------------------------------------------------

/** Every operator, in the order the editor select should present them. */
export const CONDITION_OPS = [
  "eq",
  "neq",
  "gt",
  "gte",
  "lt",
  "lte",
  "contains",
  "not_contains",
  "starts_with",
  "ends_with",
  "in",
  "not_in",
  "is_empty",
  "is_not_empty",
  "is_true",
  "is_false",
  "is_before",
  "is_after",
  "matches",
] as const satisfies readonly ConditionOp[];

/** Human-facing labels for each operator (rendered in the editor select). */
export const CONDITION_OP_LABELS: Record<ConditionOp, string> = {
  eq: "equals",
  neq: "does not equal",
  gt: "greater than",
  gte: "greater than or equal",
  lt: "less than",
  lte: "less than or equal",
  contains: "contains",
  not_contains: "does not contain",
  starts_with: "starts with",
  ends_with: "ends with",
  in: "is one of",
  not_in: "is not one of",
  is_empty: "is empty",
  is_not_empty: "is not empty",
  is_true: "is true",
  is_false: "is false",
  is_before: "is before (date)",
  is_after: "is after (date)",
  matches: "matches regex",
};

/**
 * Operators that take no operand — the editor hides the value input for these,
 * and the runner ignores any stray `value`. Keep in lockstep with the
 * `case` arms in `evalRule` that read only `fieldVal`.
 */
export const NULLARY_OPS: ReadonlySet<ConditionOp> = new Set<ConditionOp>([
  "is_empty",
  "is_not_empty",
  "is_true",
  "is_false",
]);

/**
 * Operators whose operand is a list (`value` must be an array). The editor
 * renders these as a comma-separated text input and splits on save.
 */
export const LIST_OPS: ReadonlySet<ConditionOp> = new Set<ConditionOp>(["in", "not_in"]);

/** Type guard for a runtime string being a known operator. */
export function isConditionOp(v: unknown): v is ConditionOp {
  return typeof v === "string" && (CONDITION_OPS as readonly string[]).includes(v);
}

/** True when the operator requires no `value` operand. */
export function opIsNullary(op: ConditionOp): boolean {
  return NULLARY_OPS.has(op);
}

/** True when the operator's `value` operand must be an array. */
export function opIsList(op: ConditionOp): boolean {
  return LIST_OPS.has(op);
}

export type ConditionGroup = { all: Condition[] } | { any: Condition[] } | ConditionRule;

export type Condition = ConditionGroup;

export type ConditionContext = {
  trigger: Record<string, unknown>;
  /** Mirrors the runner's `stepOutputs` array — `[{ output: ... }, ...]`. */
  steps: Array<{ output: unknown }>;
};

// ---------------------------------------------------------------------------
// Path resolution — walks the same dot/bracket notation as `resolve.ts` so
// the two stay symmetrical. Kept private here to avoid importing from
// resolve.ts (which is server-only via the runner).
// ---------------------------------------------------------------------------

function lookupPath(path: string, ctx: ConditionContext): unknown {
  const trimmed = path.trim();
  if (!trimmed) return undefined;
  const normalized = trimmed.replace(/\[\s*['"]?([^\]'"]+)['"]?\s*\]/g, ".$1");
  const segments = normalized.split(".").filter(Boolean);
  if (segments.length === 0) return undefined;
  const head = segments[0];
  let current: unknown;
  if (head === "trigger") {
    current = ctx.trigger;
  } else if (head === "step" || head === "steps") {
    current = ctx.steps;
  } else {
    return undefined;
  }
  for (let i = 1; i < segments.length; i++) {
    if (current == null) return undefined;
    const seg = segments[i]!;
    if (Array.isArray(current)) {
      const idx = Number.parseInt(seg, 10);
      if (Number.isNaN(idx)) return undefined;
      current = current[idx];
    } else if (typeof current === "object") {
      current = (current as Record<string, unknown>)[seg];
    } else {
      return undefined;
    }
  }
  return current;
}

// ---------------------------------------------------------------------------
// Op implementations
// ---------------------------------------------------------------------------

function isEmpty(v: unknown): boolean {
  if (v == null) return true;
  if (typeof v === "string") return v.length === 0;
  if (Array.isArray(v)) return v.length === 0;
  if (typeof v === "object") return Object.keys(v as Record<string, unknown>).length === 0;
  return false;
}

function toNumber(v: unknown): number | null {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "string") {
    const trimmed = v.trim();
    if (trimmed === "") return null;
    const n = Number(trimmed);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function toDateMs(v: unknown): number | null {
  if (v instanceof Date) return Number.isFinite(v.getTime()) ? v.getTime() : null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "string") {
    const t = Date.parse(v);
    return Number.isFinite(t) ? t : null;
  }
  return null;
}

/**
 * Compare two values for ordering. Tries numeric first, then date, then
 * falls back to string compare. Returns:
 *   -1 if a < b
 *    0 if a == b
 *    1 if a > b
 *   null if not comparable (one side missing or coercion failed)
 */
function compareOrdered(a: unknown, b: unknown): number | null {
  if (a == null || b == null) return null;
  const an = toNumber(a);
  const bn = toNumber(b);
  if (an !== null && bn !== null) {
    if (an < bn) return -1;
    if (an > bn) return 1;
    return 0;
  }
  const ad = toDateMs(a);
  const bd = toDateMs(b);
  if (ad !== null && bd !== null) {
    if (ad < bd) return -1;
    if (ad > bd) return 1;
    return 0;
  }
  // String fallback (case-sensitive — predictable, matches DB sort)
  const as = typeof a === "string" ? a : null;
  const bs = typeof b === "string" ? b : null;
  if (as !== null && bs !== null) {
    if (as < bs) return -1;
    if (as > bs) return 1;
    return 0;
  }
  return null;
}

function compareDateOnly(a: unknown, b: unknown): number | null {
  const ad = toDateMs(a);
  const bd = toDateMs(b);
  if (ad === null || bd === null) return null;
  if (ad < bd) return -1;
  if (ad > bd) return 1;
  return 0;
}

function asString(v: unknown): string | null {
  return typeof v === "string" ? v : null;
}

function evalRule(rule: ConditionRule, ctx: ConditionContext): boolean {
  const fieldVal = lookupPath(rule.field, ctx);
  const operand = rule.value;

  switch (rule.op) {
    case "eq":
      return fieldVal === operand;
    case "neq":
      return fieldVal !== operand;

    case "gt": {
      const c = compareOrdered(fieldVal, operand);
      return c !== null && c > 0;
    }
    case "gte": {
      const c = compareOrdered(fieldVal, operand);
      return c !== null && c >= 0;
    }
    case "lt": {
      const c = compareOrdered(fieldVal, operand);
      return c !== null && c < 0;
    }
    case "lte": {
      const c = compareOrdered(fieldVal, operand);
      return c !== null && c <= 0;
    }

    case "contains": {
      const a = asString(fieldVal);
      const b = asString(operand);
      if (a !== null && b !== null) return a.includes(b);
      // Array membership flavour — `contains` on an array matches if the
      // operand is one of the elements. Mirrors SmartSuite's "contains any
      // of" on multi-select fields with a single-value operand.
      if (Array.isArray(fieldVal)) return (fieldVal as unknown[]).includes(operand);
      return false;
    }
    case "not_contains": {
      const a = asString(fieldVal);
      const b = asString(operand);
      if (a !== null && b !== null) return !a.includes(b);
      if (Array.isArray(fieldVal)) return !(fieldVal as unknown[]).includes(operand);
      return false;
    }
    case "starts_with": {
      const a = asString(fieldVal);
      const b = asString(operand);
      return a !== null && b !== null && a.startsWith(b);
    }
    case "ends_with": {
      const a = asString(fieldVal);
      const b = asString(operand);
      return a !== null && b !== null && a.endsWith(b);
    }

    case "in":
      return Array.isArray(operand) && (operand as unknown[]).includes(fieldVal);
    case "not_in":
      return Array.isArray(operand) && !(operand as unknown[]).includes(fieldVal);

    case "is_empty":
      return isEmpty(fieldVal);
    case "is_not_empty":
      return !isEmpty(fieldVal);

    case "is_true":
      return fieldVal === true;
    case "is_false":
      return fieldVal === false;

    case "is_before": {
      const c = compareDateOnly(fieldVal, operand);
      return c !== null && c < 0;
    }
    case "is_after": {
      const c = compareDateOnly(fieldVal, operand);
      return c !== null && c > 0;
    }

    case "matches": {
      const a = asString(fieldVal);
      if (a === null) return false;
      let re: RegExp | null = null;
      if (operand instanceof RegExp) {
        re = operand;
      } else if (typeof operand === "string") {
        try {
          re = new RegExp(operand);
        } catch {
          return false;
        }
      }
      return re !== null && re.test(a);
    }

    default:
      // Exhaustiveness — TS will catch new ops at the switch, but if a
      // hand-edited JSON sneaks past, fail closed.
      return false;
  }
}

function isGroup(c: Condition): c is { all: Condition[] } | { any: Condition[] } {
  return typeof c === "object" && c !== null && ("all" in c || "any" in c);
}

/**
 * Evaluate a condition tree against a runner context. Returns `true` when
 * the condition passes (i.e. the gated step should execute), `false`
 * otherwise. `undefined` / `null` conditions are vacuously true so that
 * "no condition set" === "always run".
 */
export function evaluateCondition(condition: Condition | undefined | null, ctx: ConditionContext): boolean {
  if (condition == null) return true;

  if (isGroup(condition)) {
    if ("all" in condition) {
      // Empty `all: []` is vacuously true (universal quantifier over nothing).
      return condition.all.every((c) => evaluateCondition(c, ctx));
    }
    // Empty `any: []` is vacuously false (existential quantifier over nothing).
    return condition.any.some((c) => evaluateCondition(c, ctx));
  }

  // Leaf rule
  return evalRule(condition as ConditionRule, ctx);
}
