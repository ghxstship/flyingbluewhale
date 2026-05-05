import type { z, ZodTypeAny } from "zod";

/**
 * Pure helper that walks a Zod schema and returns a flat list of field
 * descriptors that the SchemaForm component can render as inputs.
 *
 * Constraints:
 *   - Built against Zod v4 internals (`_def.type`, `_def.innerType`, `_def.checks`,
 *     `_def.element`, `_def.shape`/`shape`, `_zod.def` on individual checks).
 *     Defensive: any unrecognized shape falls back to a `text` input instead of
 *     throwing — better to render a (possibly imperfect) form than to crash the
 *     whole step builder.
 *   - One level of object-nesting flattens to dot-paths (`to.email`). Deeper
 *     nesting is intentionally skipped in v1 since the action schemas don't
 *     use it.
 *   - Arrays of strings → comma-separated text input. Arrays of other types
 *     fall through to text (best-effort).
 *   - This file has no React, no I/O, no globals. It's trivially unit-testable.
 */

export type FieldType = "text" | "textarea" | "number" | "boolean" | "select" | "uuid" | "date" | "url" | "email";

export type FieldDescriptor = {
  /** Field key. Deep paths flatten with dots: `to.email`. */
  name: string;
  /** Humanized label derived from the name segments. */
  label: string;
  type: FieldType;
  required: boolean;
  /** For 'select': enum option values. */
  options?: { value: string; label: string }[];
  /** Min / max from string `.min/.max` or number `.min/.max`. */
  min?: number;
  max?: number;
  /** Default value, if the schema declares one. */
  default?: unknown;
  /** Optional placeholder ("{{trigger.foo}}" template hint, etc.). */
  placeholder?: string;
  /** Description from `.describe()`. */
  description?: string;
};

// --- Internal helpers -------------------------------------------------------

type ZodLike = {
  _def?: Record<string, unknown> & {
    type?: string;
    innerType?: ZodLike;
    element?: ZodLike;
    checks?: unknown[];
    shape?: () => Record<string, ZodLike>;
    entries?: Record<string, string>;
    defaultValue?: unknown;
  };
  description?: string;
  shape?: Record<string, ZodLike>;
  options?: unknown;
};

function getDef(schema: ZodLike): NonNullable<ZodLike["_def"]> {
  return (schema._def ?? {}) as NonNullable<ZodLike["_def"]>;
}

/**
 * Strip outer `ZodOptional`, `ZodNullable`, and `ZodDefault` wrappers, recording
 * whether any of them made the field optional and the default value if any.
 */
function unwrap(schema: ZodLike): {
  inner: ZodLike;
  optional: boolean;
  defaultValue?: unknown;
} {
  let cur: ZodLike = schema;
  let optional = false;
  let defaultValue: unknown;
  let safety = 0;
  while (safety++ < 16) {
    const def = getDef(cur);
    if (def.type === "optional" || def.type === "nullable") {
      optional = true;
      const inner = def.innerType;
      if (!inner) break;
      cur = inner;
      continue;
    }
    if (def.type === "default") {
      // Default → field is effectively optional, with a value if blank.
      optional = true;
      const dv = def.defaultValue;
      defaultValue = typeof dv === "function" ? (dv as () => unknown)() : dv;
      const inner = def.innerType;
      if (!inner) break;
      cur = inner;
      continue;
    }
    break;
  }
  return { inner: cur, optional, defaultValue };
}

/**
 * For a Zod string schema, peek at the registered checks to detect formats
 * (email/url/uuid/date) and min/max. Zod v4 stores formats as a check entry
 * with `_zod.def.format`.
 */
function readStringChecks(schema: ZodLike): {
  format?: "email" | "url" | "uuid" | "date";
  min?: number;
  max?: number;
} {
  const checks = getDef(schema).checks;
  if (!Array.isArray(checks)) return {};
  let format: "email" | "url" | "uuid" | "date" | undefined;
  let min: number | undefined;
  let max: number | undefined;
  for (const c of checks) {
    const cdef = (c as { _zod?: { def?: Record<string, unknown> } })._zod?.def;
    if (!cdef) continue;
    const f = cdef.format as string | undefined;
    if (f === "email" || f === "url" || f === "uuid") format = f;
    if (f === "datetime" || f === "date") format = "date";
    const check = cdef.check as string | undefined;
    if (check === "min_length" && typeof cdef.minimum === "number") min = cdef.minimum;
    if (check === "max_length" && typeof cdef.maximum === "number") max = cdef.maximum;
  }
  return { format, min, max };
}

function readNumberChecks(schema: ZodLike): { min?: number; max?: number } {
  const checks = getDef(schema).checks;
  if (!Array.isArray(checks)) return {};
  let min: number | undefined;
  let max: number | undefined;
  for (const c of checks) {
    const cdef = (c as { _zod?: { def?: Record<string, unknown> } })._zod?.def;
    if (!cdef) continue;
    const check = cdef.check as string | undefined;
    if (check === "greater_than" && typeof cdef.value === "number") min = cdef.value;
    if (check === "less_than" && typeof cdef.value === "number") max = cdef.value;
  }
  return { min, max };
}

function humanize(path: string): string {
  return path
    .split(".")
    .map((seg) =>
      seg
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .replace(/[_-]+/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .replace(/\b\w/g, (m) => m.toUpperCase()),
    )
    .join(" / ");
}

function enumOptions(schema: ZodLike): { value: string; label: string }[] | undefined {
  const def = getDef(schema);
  if (def.type !== "enum") return undefined;
  // Zod v4 stores enum entries as `{ value: value }` map.
  const entries = def.entries;
  if (entries && typeof entries === "object") {
    return Object.values(entries).map((v) => ({ value: String(v), label: humanize(String(v)) }));
  }
  // Fallback for older Zod shapes that exposed `.options`.
  const opts = schema.options as unknown as string[] | undefined;
  if (Array.isArray(opts)) return opts.map((v) => ({ value: String(v), label: humanize(String(v)) }));
  return undefined;
}

// --- Public API -------------------------------------------------------------

function describeField(name: string, schema: ZodLike, parentRequired = true): FieldDescriptor {
  const { inner, optional, defaultValue } = unwrap(schema);
  const def = getDef(inner);
  const description = inner.description;
  const required = parentRequired && !optional;
  const label = humanize(name);
  const baseDefault = defaultValue;

  switch (def.type) {
    case "string": {
      const { format, min, max } = readStringChecks(inner);
      const isLong = typeof max === "number" && max > 500;
      const type: FieldType = format ?? (isLong ? "textarea" : "text");
      return {
        name,
        label,
        type,
        required,
        min,
        max,
        default: baseDefault,
        description,
      };
    }
    case "number": {
      const { min, max } = readNumberChecks(inner);
      return {
        name,
        label,
        type: "number",
        required,
        min,
        max,
        default: baseDefault,
        description,
      };
    }
    case "boolean":
      return {
        name,
        label,
        type: "boolean",
        required,
        default: baseDefault,
        description,
      };
    case "enum": {
      const options = enumOptions(inner);
      return {
        name,
        label,
        type: "select",
        required,
        options,
        default: baseDefault,
        description,
      };
    }
    case "literal": {
      // Treated as a fixed-value text field.
      return {
        name,
        label,
        type: "text",
        required,
        default: baseDefault,
        description,
      };
    }
    case "array": {
      // String arrays render as comma-separated text. Other arrays fall back
      // to a textarea (caller will likely paste JSON).
      const elInner = unwrap((def.element as ZodLike) ?? {}).inner;
      const elType = getDef(elInner).type;
      return {
        name,
        label,
        type: elType === "string" ? "text" : "textarea",
        required,
        default: baseDefault,
        description: description ?? (elType === "string" ? "Comma-separated list" : description),
      };
    }
    case "union": {
      // Pick the first concrete option. Good enough for the few unions in our
      // action library (e.g. `email-send` accepts string OR string[]).
      const opts = (def.options ?? inner.options) as ZodLike[] | undefined;
      if (Array.isArray(opts) && opts.length > 0) {
        return describeField(name, opts[0]!, parentRequired && !optional);
      }
      return { name, label, type: "text", required, default: baseDefault, description };
    }
    case "record":
    case "object":
      // Caller flattens these — should not reach here as a leaf.
      return { name, label, type: "textarea", required, default: baseDefault, description };
    default:
      return { name, label, type: "text", required, default: baseDefault, description };
  }
}

/**
 * Walk the top-level object schema (and one level of nested objects) and
 * produce a flat list of FieldDescriptor entries.
 */
export function zodToFormFields(schema: ZodTypeAny): FieldDescriptor[] {
  const root = schema as unknown as ZodLike;
  const { inner } = unwrap(root);
  const def = getDef(inner);
  if (def.type !== "object") {
    // If someone passes a non-object schema, treat it as a single anonymous field.
    return [describeField("value", inner)];
  }

  // Zod v4 lazy-computes shape via a function; v3 exposed `.shape` directly.
  let shape: Record<string, ZodLike> | undefined;
  const directShape = (inner.shape ?? null) as Record<string, ZodLike> | null;
  if (directShape && typeof directShape === "object") {
    shape = directShape;
  } else if (typeof def.shape === "function") {
    shape = def.shape() as Record<string, ZodLike>;
  }
  if (!shape) return [];

  const out: FieldDescriptor[] = [];
  for (const [key, child] of Object.entries(shape)) {
    const { inner: childInner, optional: childOptional } = unwrap(child);
    const childDef = getDef(childInner);
    if (childDef.type === "object") {
      // One level of flattening: read the nested shape too.
      let nested: Record<string, ZodLike> | undefined;
      const nestedDirect = (childInner.shape ?? null) as Record<string, ZodLike> | null;
      if (nestedDirect && typeof nestedDirect === "object") {
        nested = nestedDirect;
      } else if (typeof childDef.shape === "function") {
        nested = childDef.shape() as Record<string, ZodLike>;
      }
      if (nested) {
        for (const [nKey, nChild] of Object.entries(nested)) {
          out.push(describeField(`${key}.${nKey}`, nChild, !childOptional));
        }
        continue;
      }
    }
    out.push(describeField(key, child));
  }
  return out;
}

export type ResolvedZodSchema = z.ZodTypeAny;
