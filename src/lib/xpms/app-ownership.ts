/**
 * XPMS app-ownership canon (marketing/onboarding rebuild plan §2a; migration
 * 20260723030000_dim_department_bible_remap).
 *
 * Every XPMS 2.5 department class is OWNED by one of the four apps:
 *
 *   0000 Executive               → legend  (the org tier IS the Organization Hub)
 *   1000 Creative … 3000 Marketing   → atlvs
 *   4000 Build … 6000 Operations     → compvss
 *   7000 Experience … 9000 Technology → gvteway
 *
 * The runtime SSOT is `public.dim_department.app` — consumers should read the
 * column and validate through `isDepartmentApp`. The static maps here are the
 * compile-level mirror (a `Record<DepartmentApp, …>` keeps every consumer
 * exhaustive) and the fallback when a join misses.
 *
 * Colors: each app OWNS its accent (v8.0 palette-locked) and the App Rail
 * work exposes them as the `--brand-{app}` identity token families in
 * `src/app/theme/themes/atlvs-product.css`. The chip tokens below reference
 * only those vars — no hex literals.
 */

export const DEPARTMENT_APPS = ["legend", "atlvs", "compvss", "gvteway"] as const;
export type DepartmentApp = (typeof DEPARTMENT_APPS)[number];

export function isDepartmentApp(value: unknown): value is DepartmentApp {
  return typeof value === "string" && (DEPARTMENT_APPS as readonly string[]).includes(value);
}

/** Display wordmark per app (brand canon: fixed sub-brand names). */
export const APP_LABEL: Record<DepartmentApp, string> = {
  legend: "LEG3ND",
  atlvs: "ATLVS",
  compvss: "COMPVSS",
  gvteway: "GVTEWAY",
};

/**
 * Chip color tokens per app — the `--brand-*` identity families
 * (atlvs-product.css). `fg` is the AA-certified `-text` role; `base` is the
 * raw accent, used only as a low-opacity tint via color-mix.
 */
export const APP_TOKEN: Record<DepartmentApp, { fg: string; base: string }> = {
  legend: { fg: "var(--brand-legend-text)", base: "var(--brand-legend)" },
  atlvs: { fg: "var(--brand-atlvs-text)", base: "var(--brand-atlvs)" },
  compvss: { fg: "var(--brand-compvss-text)", base: "var(--brand-compvss)" },
  gvteway: { fg: "var(--brand-gvteway-text)", base: "var(--brand-gvteway)" },
};

/**
 * Static mirror of the dim_department.app seed (migration §1). Fallback only
 * — prefer the live column.
 */
export const DEPT_CODE_APP: Record<string, DepartmentApp> = {
  "0000": "legend",
  "1000": "atlvs",
  "2000": "atlvs",
  "3000": "atlvs",
  "4000": "compvss",
  "5000": "compvss",
  "6000": "compvss",
  "7000": "gvteway",
  "8000": "gvteway",
  "9000": "gvteway",
};

/**
 * Resolve a department/cost-center code to its owning app. Sub-codes roll up
 * to their thousand-class (5100 → 5000 → compvss).
 */
export function appForDeptCode(code: string | null | undefined): DepartmentApp | null {
  if (!code || !/^\d/.test(code)) return null;
  return DEPT_CODE_APP[`${code[0]}000`] ?? null;
}
