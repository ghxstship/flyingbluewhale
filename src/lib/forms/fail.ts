import type { ZodError } from "zod";
import { actionErrorMessage } from "@/lib/errors";

/**
 * Validation-failure helpers for server actions feeding <FormShell>.
 *
 * React server actions reset uncontrolled inputs when the action returns —
 * without echoing `values` back, a single validation error wipes the whole
 * form and the user retypes everything. FormShell already restores from
 * `state.values` and renders `state.fieldErrors` per-field; these helpers
 * produce that shape from a failed safeParse + the submitted FormData.
 *
 * Usage:
 *   const parsed = Schema.safeParse(Object.fromEntries(fd));
 *   if (!parsed.success) return formFail(parsed.error, fd);
 */

/** Flatten Zod issues to FormShell's { "field.path": message } map. */
export function zodFieldErrors(error: ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    if (key && !out[key]) out[key] = issue.message;
  }
  return out;
}

/**
 * Echo submitted values for FormShell's restore mechanism. Files and
 * multi-value fields are skipped (restore patches `.value` on named
 * inputs — only string scalars round-trip safely). Passwords and other
 * `_`-prefixed/secret-named fields are excluded so credentials never
 * ride back through the RSC payload.
 */
export function echoValues(fd: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [name, value] of fd.entries()) {
    if (typeof value !== "string") continue;
    if (/password|secret|token/i.test(name)) continue;
    if (name.startsWith("$") || name.startsWith("_")) continue;
    if (name in out) continue; // first value wins; multi-selects don't restore
    if (value.length > 10_000) continue;
    out[name] = value;
  }
  return out;
}

/**
 * The standard validation-failure return: banner message + per-field
 * errors + value echo. Matches FormShell's FormState contract.
 */
export function formFail(
  error: ZodError,
  fd: FormData,
  banner = actionErrorMessage("check-the-fields-below", "Check the fields below"),
): { error: string; fieldErrors: Record<string, string>; values: Record<string, string> } {
  return { error: banner, fieldErrors: zodFieldErrors(error), values: echoValues(fd) };
}

/**
 * Failure shape for non-validation errors (DB writes etc.) that should
 * still preserve what the user typed.
 */
export function actionFail(message: string, fd?: FormData): { error: string; values?: Record<string, string> } {
  return fd ? { error: message, values: echoValues(fd) } : { error: message };
}
