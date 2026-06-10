/**
 * Mustache-like template resolver — Phase 4.1 of the SmartSuite parity roadmap.
 *
 * Resolves `{{path}}` placeholders inside automation step inputs at run time.
 * Walks objects/arrays/strings recursively. Two modes:
 *
 *  1. Whole-string match (`/^\{\{(.+)\}\}$/`) — preserves the resolved value's
 *     type (number, boolean, object, array). This is what lets a `record.update`
 *     action receive `{ amount: "{{trigger.amountCents}}" }` and have it land
 *     as a number, not the string "1234".
 *  2. Partial templates ("Hello {{trigger.name}}") — coerces to string and
 *     interpolates. Missing paths render as the empty string.
 *
 * Paths support dot-notation and bracket-notation: `step.0.output.id`,
 * `step[1].output.email`, `trigger.record.fields.title`. Unknown paths in
 * whole-string mode return `undefined` (so the caller can detect and decide
 * whether to fail validation downstream).
 *
 * Pure function — no I/O, no globals. Trivially unit-testable.
 */

export type ResolveContext = {
  steps: unknown[];
  trigger: Record<string, unknown>;
};

const WHOLE_TEMPLATE_RE = /^\{\{\s*([^{}]+?)\s*\}\}$/;
const ANY_TEMPLATE_RE = /\{\{\s*([^{}]+?)\s*\}\}/g;

/**
 * Walk a dot/bracket path (e.g. `step.0.output.id`, `trigger[0].name`) against
 * the context and return the value at that path, or `undefined` if any segment
 * is missing.
 */
function lookupPath(path: string, ctx: ResolveContext): unknown {
  const trimmed = path.trim();
  if (!trimmed) return undefined;

  // Normalize bracket notation to dot notation: `step[1].output.email` →
  // `step.1.output.email`. Strips quotes inside brackets too.
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

function coerceToString(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function resolveString(template: string, ctx: ResolveContext): unknown {
  const whole = template.match(WHOLE_TEMPLATE_RE);
  if (whole) {
    return lookupPath(whole[1]!, ctx);
  }
  // Partial interpolation — coerce each placeholder to a string and splice in.
  return template.replace(ANY_TEMPLATE_RE, (_match, path: string) => coerceToString(lookupPath(path, ctx)));
}

/**
 * Resolve placeholders inside any JSON-shaped input. Returns the same
 * structural shape with placeholders replaced. Non-string scalars pass
 * through untouched.
 */
export function resolveTemplate(input: unknown, ctx: ResolveContext): unknown {
  if (input == null) return input;
  if (typeof input === "string") return resolveString(input, ctx);
  if (Array.isArray(input)) return input.map((item) => resolveTemplate(item, ctx));
  if (typeof input === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
      out[key] = resolveTemplate(value, ctx);
    }
    return out;
  }
  return input;
}
