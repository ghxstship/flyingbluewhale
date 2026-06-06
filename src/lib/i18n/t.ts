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
 * Build a `t(key, vars?, fallback?)` translator over a primary catalog with
 * optional fallback catalogs. Lookup walks the chain in order — the primary
 * locale wins, missing keys fall back to (typically) the English catalog,
 * and only if every catalog misses do we surface the `fallback` arg (or the
 * key path if no fallback was supplied).
 *
 * Pattern:
 *   const t = makeT(spanish, [english]);
 *   t("common.save")              // "Guardar" if present, else "Save"
 *   t("nav.foo.bar", undefined, "Foo Bar")  // English fallback while
 *                                            // catalogs are being filled.
 *
 * The third `fallback` argument is the migration release valve: it lets the
 * caller ship `t()` call sites BEFORE the catalog has the key, so the UI
 * never flashes dot-paths during a rollout. Once the catalog is populated,
 * the fallback becomes inert (the primary lookup wins). Production calls
 * never log warnings; dev calls log once-per-key per process to surface
 * staleness.
 */
const __missingKeyOnce = new Set<string>();

// A catalog value is only usable if it doesn't carry the JS template-literal
// placeholder syntax `${…}`. Some machine-generated catalog entries captured
// the call-site fallback verbatim (e.g. "Mark ${next}", "${days}d left",
// "${projects.length} Total"). Our interpolator only resolves `{name}` braces,
// so a `${…}` value would leak the raw literal to the UI (or strand a stray
// `$`). Treat those as "missing" so lookup falls through to the next catalog
// and ultimately the call-site `fallback` arg — which is the real JS template
// literal, already evaluated to the correct string by the time it reaches t().
function usableCatalogValue(raw: string | undefined): raw is string {
  return raw !== undefined && !raw.includes("${");
}

export function makeT(messages: Messages, fallbacks: Messages[] = []) {
  return function t(key: string, vars?: Record<string, string | number>, fallback?: string): string {
    let raw = getByPath(messages, key);
    if (!usableCatalogValue(raw)) {
      raw = undefined;
      for (const fb of fallbacks) {
        const v = getByPath(fb, key);
        if (usableCatalogValue(v)) {
          raw = v;
          break;
        }
      }
    }
    if (raw === undefined) {
      if (process.env.NODE_ENV === "development" && !__missingKeyOnce.has(key)) {
        __missingKeyOnce.add(key);
        console.warn(`[i18n] missing key: ${key}${fallback ? ` (using fallback)` : ""}`);
      }
      return fallback ?? key;
    }
    return interpolate(raw, vars);
  };
}
