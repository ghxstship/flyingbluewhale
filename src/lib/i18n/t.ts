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
  return template.replace(/\{(\w+)\}/g, (_, k: string) =>
    k in vars ? String(vars[k]) : `{${k}}`,
  );
}

export function makeT(messages: Messages) {
  return function t(key: string, vars?: Record<string, string | number>): string {
    const raw = getByPath(messages, key);
    if (raw === undefined) {
      // In dev, surface missing key; in prod, return the key for visibility.
      if (process.env.NODE_ENV === "development") {
        console.warn(`[i18n] missing key: ${key}`);
      }
      return key;
    }
    return interpolate(raw, vars);
  };
}
