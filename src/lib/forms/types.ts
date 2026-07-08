/**
 * Forms v2 schema types — Phase 6.2 of the SmartSuite parity roadmap.
 *
 * Per https://help.smartsuite.com/en/articles/6267415-form-view, public forms
 * support sectioned conditional logic, file uploads, captcha, prefill, and
 * passcode protection. We mirror that contract and add private-by-default
 * file storage + Turnstile captcha (no Google account needed).
 *
 * The shape lives in `form_defs.schema` (JSONB). Backwards-compatible: a
 * pre-v2 schema with `fields[]` only still renders.
 */

export type PublicFormFieldType =
  | "text"
  | "textarea"
  | "email"
  | "url"
  | "tel"
  | "number"
  | "date"
  | "select"
  | "radio"
  | "checkbox"
  | "file";

export type FieldCondition = {
  /** Field key whose value gates this field's visibility. */
  ifField: string;
  /**
   * Match comparator. Default 'eq'. For 'in', `value` is an array.
   * For 'truthy' / 'falsy', `value` is ignored.
   */
  op?: "eq" | "neq" | "in" | "truthy" | "falsy";
  value?: string | number | boolean | string[];
};

export type PublicFormField = {
  key: string;
  label: string;
  type: PublicFormFieldType;
  required?: boolean;
  placeholder?: string;
  /** For select/radio. */
  options?: string[];
  /** For text/textarea/number. */
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  /** Per-field help text (700-char rich-text equivalent: plain string for now). */
  help?: string;
  /** Conditional visibility. All conditions must match (AND). */
  conditions?: FieldCondition[];
  /** When true, prefill from URL query param `?<key>=...`. Default true. */
  prefillFromUrl?: boolean;
  /** Section grouping — fields with the same `section` render under one heading. */
  section?: string;
  /** Default value (also used as prefill fallback). */
  default?: string | number | boolean;
};

export type FormSection = {
  id: string;
  heading: string;
  description?: string;
  /** Conditional show/hide for the entire section. */
  conditions?: FieldCondition[];
};

export type FormSchema = {
  /** Schema version. Absent or 1 = the v1 flat-fields shape. 2 enables sections + conditions. */
  version?: 1 | 2;
  sections?: FormSection[];
  fields: PublicFormField[];
  /** Submit-time settings. */
  submit?: {
    /** Redirect to this URL after success. */
    redirectUrl?: string;
    /** Override the default thank-you copy. */
    thankYouTitle?: string;
    thankYouBody?: string;
    /** Submit button label. Default "Submit". */
    submitLabel?: string;
  };
  /** Anti-spam controls. */
  antiSpam?: {
    /** Enable Cloudflare Turnstile captcha. Site key supplied via env. Default false. */
    captcha?: boolean;
  };
  /** Optional access controls. */
  access?: {
    /** Require a passcode before the form renders. Hashed server-side. */
    passcode?: boolean;
  };
  /** Optional payment gate (Stripe). When set, submission triggers checkout
   *  before the row lands as `paid`. */
  payment?: {
    amountCents: number;
    currency: string;
    description?: string;
  };
};

/** Coerce raw JSONB into a normalized FormSchema. Tolerant of the old flat v1
 * shape (a bare `fields[]` with no version/sections) — it normalizes into the
 * same FormSchema the single renderer consumes. */
export function coerceFormSchema(raw: unknown): FormSchema {
  if (!raw || typeof raw !== "object") return { fields: [] };
  const r = raw as Record<string, unknown>;
  const fields = Array.isArray(r.fields) ? (r.fields as Record<string, unknown>[]) : [];
  const normalized: PublicFormField[] = fields
    .filter((f) => typeof f === "object" && f !== null)
    .map((f) => ({
      key: String(f.key ?? ""),
      label: String(f.label ?? ""),
      type: (f.type as PublicFormFieldType) ?? "text",
      required: Boolean(f.required),
      placeholder: typeof f.placeholder === "string" ? f.placeholder : undefined,
      options: Array.isArray(f.options) ? (f.options as string[]) : undefined,
      minLength: typeof f.minLength === "number" ? f.minLength : undefined,
      maxLength: typeof f.maxLength === "number" ? f.maxLength : undefined,
      min: typeof f.min === "number" ? f.min : undefined,
      max: typeof f.max === "number" ? f.max : undefined,
      help: typeof f.help === "string" ? f.help : undefined,
      conditions: Array.isArray(f.conditions) ? (f.conditions as FieldCondition[]) : undefined,
      prefillFromUrl: f.prefillFromUrl !== false,
      section: typeof f.section === "string" ? f.section : undefined,
      default:
        typeof f.default === "string" || typeof f.default === "number" || typeof f.default === "boolean"
          ? f.default
          : undefined,
    }))
    .filter((f) => f.key && f.label);
  return {
    version: r.version === 2 ? 2 : 1,
    sections: Array.isArray(r.sections) ? (r.sections as FormSection[]) : undefined,
    fields: normalized,
    submit: typeof r.submit === "object" && r.submit ? (r.submit as FormSchema["submit"]) : undefined,
    antiSpam: typeof r.antiSpam === "object" && r.antiSpam ? (r.antiSpam as FormSchema["antiSpam"]) : undefined,
    access: typeof r.access === "object" && r.access ? (r.access as FormSchema["access"]) : undefined,
    payment: typeof r.payment === "object" && r.payment ? (r.payment as FormSchema["payment"]) : undefined,
  };
}

/** Pure: evaluate a field's `conditions[]` against current form values. */
export function evaluateCondition(condition: FieldCondition, values: Record<string, unknown>): boolean {
  const v = values[condition.ifField];
  const op = condition.op ?? "eq";
  switch (op) {
    case "eq":
      return v === condition.value;
    case "neq":
      return v !== condition.value;
    case "in":
      return Array.isArray(condition.value) && condition.value.includes(String(v));
    case "truthy":
      return Boolean(v);
    case "falsy":
      return !v;
    default:
      return false;
  }
}

export function isFieldVisible(field: PublicFormField, values: Record<string, unknown>): boolean {
  if (!field.conditions || field.conditions.length === 0) return true;
  return field.conditions.every((c) => evaluateCondition(c, values));
}

export function isSectionVisible(section: FormSection, values: Record<string, unknown>): boolean {
  if (!section.conditions || section.conditions.length === 0) return true;
  return section.conditions.every((c) => evaluateCondition(c, values));
}
