"use client";

/**
 * Client half of the server-action error i18n layer (see src/lib/errors.ts).
 *
 * Bespoke render sites (anything not going through <FormShell>) resolve
 * action error strings with this hook before showing them — sentinel
 * codes ("@err:<code>") map through t("errors.<code>"), plain strings
 * pass through unchanged:
 *
 *   const resolveErr = useActionErrorResolver();
 *   ...
 *   toast.error(resolveErr(res.error));
 */

import { useCallback } from "react";
import { useT } from "@/lib/i18n/LocaleProvider";
import { resolveActionError } from "./errors";

export function useActionErrorResolver(): (error: string) => string {
  const t = useT();
  return useCallback((error: string) => resolveActionError(error, t), [t]);
}
