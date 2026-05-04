/**
 * Tiny ICU-lite translator. For server components + client — no provider required.
 * Supports: dot-path keys, {placeholder} interpolation, nested objects.
 *
 * For pluralization / full ICU, swap this for next-intl's `useTranslations`
 * hook — this function's call signature intentionally matches `t('key', vars)`.
 */

export type Messages = Record<string, unknown>;

export function getByPath(obj: Messages, path: string): string | undefined {
  const parts = path.split(".");
  let node: unknown = obj;
  for (const p of parts) {
    if (node && typeof node === "object" && p in (node as Record<string, unknown>)) {
      node = (node as Record<string, unknown>)[p];
    } else {
      return undefined;
    }
  }
  return typeof node === "string" ? node : undefined;
}

export function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, k: string) => (k in vars ? String(vars[k]) : `{${k}}`));
}

/**
 * Build a `t(key, vars?)` translator over a primary catalog with optional
 * fallback catalogs. Lookup walks the chain in order — the primary locale
 * wins, missing keys fall back to (typically) the English catalog, and only
 * if every catalog misses do we surface the key path.
 *
 * Pattern:
 *   const t = makeT(spanish, [english]);
 *   t("common.save")          // "Guardar" if present, else "Save"
 *
 * Locale catalog stubs can therefore be partial — translators add keys
 * incrementally without UIs flashing dot-paths during the rollout.
 */
export function makeT(messages: Messages, fallbacks: Messages[] = []) {
  return function t(key: string, vars?: Record<string, string | number>): string {
    let raw = getByPath(messages, key);
    if (raw === undefined) {
      for (const fb of fallbacks) {
        raw = getByPath(fb, key);
        if (raw !== undefined) break;
      }
    }
    if (raw === undefined) {
      if (process.env.NODE_ENV === "development") {
        console.warn(`[i18n] missing key: ${key}`);
      }
      return key;
    }
    return interpolate(raw, vars);
  };
}
