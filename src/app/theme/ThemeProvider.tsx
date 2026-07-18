"use client";

import * as React from "react";
import { THEMES, isValidThemeSlug, type ThemeSlug, type ThemeFamily } from "./themes.config";
import {
  THEME_COOKIE_NAME,
  THEME_STORAGE_KEY,
  MODE_COOKIE_NAME,
  LEGACY_MODE_COOKIE_NAME,
  MODE_STORAGE_KEY,
  ACCENT_COOKIE_NAME,
  ACCENT_STORAGE_KEY,
  TYPE_COOKIE_NAME,
  TYPE_STORAGE_KEY,
  TREND_COOKIE_NAME,
  TREND_STORAGE_KEY,
} from "./theme-script";

export type ColorMode = "light" | "dark" | "system";
// Density — kit v3 axis: `cozy` (default) | `compact`. `spacious` is a
// documented codebase extension (tablet / accessibility), flagged for Claude
// Design. The pre-MONUMENT default label "comfortable" was renamed to the
// kit's "cozy"; legacy stored values fall back to "cozy" (identical default).
export type Density = "compact" | "cozy" | "spacious";
export type AccentIntensity = "soft" | "default" | "vivid";

const DENSITIES: Density[] = ["compact", "cozy", "spacious"];
function isValidDensity(v: unknown): v is Density {
  return typeof v === "string" && (DENSITIES as string[]).includes(v);
}
const ACCENTS: AccentIntensity[] = ["soft", "default", "vivid"];
function isValidAccent(v: unknown): v is AccentIntensity {
  return typeof v === "string" && (ACCENTS as string[]).includes(v);
}
// Type axis (kit v5) — Monument (default) ↔ LEG3ND airport-signage type.
export type TypeAxis = "monument" | "legend";
const TYPE_AXES: TypeAxis[] = ["monument", "legend"];
function isValidTypeAxis(v: unknown): v is TypeAxis {
  return typeof v === "string" && (TYPE_AXES as string[]).includes(v);
}
// Trend axis (v8.1) — end-user personalization skin, orthogonal to every other
// axis. `none` (default) keeps the Monument base; the others re-skin shape /
// elevation / motion / expression, hue-locked to the product accent.
export type Trend =
  | "none"
  | "immersive"
  | "experimental"
  | "dopamine"
  | "bold-type"
  | "dark"
  | "motion"
  | "gamified"
  | "neumorphic"
  | "synthwave"
  | "maximalist"
  | "collage"
  | "brutalist"
  | "sustainable";
const TRENDS: Trend[] = [
  "none",
  "immersive",
  "experimental",
  "dopamine",
  "bold-type",
  "dark",
  "motion",
  "gamified",
  "neumorphic",
  "synthwave",
  "maximalist",
  "collage",
  "brutalist",
  "sustainable",
];
function isValidTrend(v: unknown): v is Trend {
  return typeof v === "string" && (TRENDS as string[]).includes(v);
}

// Trend CSS (kit-trends.css, 23KB) is kept off the core path per CLAUDE.md — it
// loads as a runtime <link> only when a non-default trend is active. The
// pre-hydration theme-script injects it on first paint for a persisted trend;
// this mirrors the add/remove when the user switches trend live. Idempotent.
const TREND_LINK_ID = "atlvs-trend-css";
function ensureTrendStylesheet(active: boolean) {
  if (typeof document === "undefined") return;
  const existing = document.getElementById(TREND_LINK_ID);
  if (active) {
    if (existing) return;
    const link = document.createElement("link");
    link.id = TREND_LINK_ID;
    link.rel = "stylesheet";
    link.href = "/theme/kit-trends.css";
    document.head.appendChild(link);
  } else if (existing) {
    existing.remove();
  }
}

export interface ThemeContextValue {
  theme: ThemeSlug;
  family: ThemeFamily;
  setTheme: (slug: ThemeSlug) => void;
  /** True when the user hasn't picked a theme manually. */
  isSystemDriven: boolean;
  resetToSystem: () => void;
  /** Density is orthogonal to theme. Three modes per IA spec §5.4. */
  density: Density;
  setDensity: (d: Density) => void;
  /**
   * Color mode — orthogonal to the design theme slug. `system` honors
   * `prefers-color-scheme`. Applied as `data-mode` on <html>.
   */
  mode: ColorMode;
  setMode: (m: ColorMode) => void;
  /** Kit axis — accent intensity (soft/default/vivid). Persists. */
  accent: AccentIntensity;
  setAccent: (a: AccentIntensity) => void;
  /** Kit v5 axis — type system (monument/legend). Applied as data-type. Persists. */
  typeAxis: TypeAxis;
  setTypeAxis: (t: TypeAxis) => void;
  /** Kit v8.1 axis — personalization trend. Applied as data-trend (omitted when
   * "none"). Persists. Orthogonal to product/mode/density/accent/type. */
  trend: Trend;
  setTrend: (t: Trend) => void;
}

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

function writeCookie(key: string, value: string) {
  document.cookie = `${key}=${encodeURIComponent(value)}; max-age=${COOKIE_MAX_AGE}; path=/; samesite=lax`;
}

async function persistRemote(patch: { theme?: ThemeSlug; density?: Density }) {
  try {
    await fetch("/api/v1/me/preferences", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(patch),
    });
  } catch {
    /* offline / anon */
  }
}

function systemDefault(): ThemeSlug {
  // Single canonical kit skin.
  return "atlvs-product";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<ThemeSlug>("atlvs-product");
  const [isSystemDriven, setSystemDriven] = React.useState(true);
  const [density, setDensityState] = React.useState<Density>("cozy");
  const [mode, setModeState] = React.useState<ColorMode>("system");
  const [accent, setAccentState] = React.useState<AccentIntensity>("default");
  const [typeAxis, setTypeAxisState] = React.useState<TypeAxis>("monument");
  const [trend, setTrendState] = React.useState<Trend>("none");
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    const fromDom = document.documentElement.getAttribute("data-theme");
    const stored = (() => {
      try {
        return localStorage.getItem(THEME_STORAGE_KEY);
      } catch {
        return null;
      }
    })();
    const t = isValidThemeSlug(fromDom) ? fromDom : isValidThemeSlug(stored) ? stored : systemDefault();
    setThemeState(t);
    setSystemDriven(!stored);

    const storedDensity = localStorage.getItem("chroma.density");
    setDensityState(isValidDensity(storedDensity) ? storedDensity : "cozy");

    const cookieMode = (() => {
      const tryRead = (key: string) => {
        const re = new RegExp(`(?:^|;\\s*)${key}=([^;]+)`);
        const m = document.cookie.match(re);
        const v = m ? decodeURIComponent(m[1]!) : null;
        return v === "light" || v === "dark" || v === "system" ? (v as ColorMode) : null;
      };
      return tryRead(MODE_COOKIE_NAME) ?? tryRead(LEGACY_MODE_COOKIE_NAME);
    })();
    const storedMode = (() => {
      try {
        const v = localStorage.getItem(MODE_STORAGE_KEY);
        return v === "light" || v === "dark" || v === "system" ? (v as ColorMode) : null;
      } catch {
        return null;
      }
    })();
    setModeState(cookieMode ?? storedMode ?? "system");

    const cookieAccent = (() => {
      const re = new RegExp(`(?:^|;\\s*)${ACCENT_COOKIE_NAME}=([^;]+)`);
      const m = document.cookie.match(re);
      const v = m ? decodeURIComponent(m[1]!) : null;
      return isValidAccent(v) ? v : null;
    })();
    const storedAccent = (() => {
      try {
        const v = localStorage.getItem(ACCENT_STORAGE_KEY);
        return isValidAccent(v) ? v : null;
      } catch {
        return null;
      }
    })();
    setAccentState(cookieAccent ?? storedAccent ?? "default");

    const cookieType = (() => {
      const re = new RegExp(`(?:^|;\\s*)${TYPE_COOKIE_NAME}=([^;]+)`);
      const m = document.cookie.match(re);
      const v = m ? decodeURIComponent(m[1]!) : null;
      return isValidTypeAxis(v) ? v : null;
    })();
    const storedType = (() => {
      try {
        const v = localStorage.getItem(TYPE_STORAGE_KEY);
        return isValidTypeAxis(v) ? v : null;
      } catch {
        return null;
      }
    })();
    setTypeAxisState(cookieType ?? storedType ?? "monument");

    const cookieTrend = (() => {
      const re = new RegExp(`(?:^|;\\s*)${TREND_COOKIE_NAME}=([^;]+)`);
      const m = document.cookie.match(re);
      const v = m ? decodeURIComponent(m[1]!) : null;
      return isValidTrend(v) ? v : null;
    })();
    const storedTrend = (() => {
      try {
        const v = localStorage.getItem(TREND_STORAGE_KEY);
        return isValidTrend(v) ? v : null;
      } catch {
        return null;
      }
    })();
    setTrendState(cookieTrend ?? storedTrend ?? "none");

    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!mounted) return;
    document.documentElement.setAttribute("data-theme", theme);
    // Mirror data-ui="saas" so kit-canon selectors paint alongside legacy
    // [data-theme="atlvs-product"] scoping.
    document.documentElement.setAttribute("data-ui", "saas");
  }, [theme, mounted]);

  React.useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    if (density === "cozy") root.removeAttribute("data-density");
    else root.setAttribute("data-density", density);
  }, [density, mounted]);

  React.useEffect(() => {
    if (!mounted) return;
    const resolved =
      mode === "system" ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light") : mode;
    document.documentElement.setAttribute("data-mode", resolved);
    document.documentElement.style.colorScheme = resolved === "dark" ? "dark" : "light";
  }, [mode, mounted]);

  React.useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    if (accent === "default") root.removeAttribute("data-accent");
    else root.setAttribute("data-accent", accent);
  }, [accent, mounted]);

  React.useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    if (typeAxis === "monument") root.removeAttribute("data-type");
    else root.setAttribute("data-type", typeAxis);
  }, [typeAxis, mounted]);

  React.useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    if (trend === "none") root.removeAttribute("data-trend");
    else root.setAttribute("data-trend", trend);
    // Lazy-load / unload the trend stylesheet to match the active trend.
    ensureTrendStylesheet(trend !== "none");
  }, [trend, mounted]);

  React.useEffect(() => {
    if (!mounted || mode !== "system") return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    function onChange() {
      const next = mql.matches ? "dark" : "light";
      document.documentElement.setAttribute("data-mode", next);
      document.documentElement.style.colorScheme = next;
    }
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [mode, mounted]);

  React.useEffect(() => {
    if (!mounted) return;
    function onStorage(e: StorageEvent) {
      if (e.key !== THEME_STORAGE_KEY || !e.newValue) return;
      if (isValidThemeSlug(e.newValue) && e.newValue !== theme) {
        setThemeState(e.newValue);
        setSystemDriven(false);
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [mounted, theme]);

  const setTheme = React.useCallback((slug: ThemeSlug) => {
    setThemeState(slug);
    setSystemDriven(false);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, slug);
    } catch {
      /* ignore */
    }
    writeCookie(THEME_COOKIE_NAME, slug);
    void persistRemote({ theme: slug });
  }, []);

  const resetToSystem = React.useCallback(() => {
    try {
      localStorage.removeItem(THEME_STORAGE_KEY);
    } catch {
      /* ignore */
    }
    document.cookie = `${THEME_COOKIE_NAME}=; max-age=0; path=/`;
    const next = systemDefault();
    setThemeState(next);
    setSystemDriven(true);
  }, []);

  const setDensity = React.useCallback((d: Density) => {
    setDensityState(d);
    try {
      localStorage.setItem("chroma.density", d);
    } catch {
      /* ignore */
    }
    writeCookie("atlvs_density", d);
    void persistRemote({ density: d });
  }, []);

  const setMode = React.useCallback((m: ColorMode) => {
    setModeState(m);
    try {
      localStorage.setItem(MODE_STORAGE_KEY, m);
    } catch {
      /* ignore */
    }
    writeCookie(MODE_COOKIE_NAME, m);
  }, []);

  const setAccent = React.useCallback((a: AccentIntensity) => {
    setAccentState(a);
    try {
      localStorage.setItem(ACCENT_STORAGE_KEY, a);
    } catch {
      /* ignore */
    }
    writeCookie(ACCENT_COOKIE_NAME, a);
  }, []);

  const setTypeAxis = React.useCallback((t: TypeAxis) => {
    setTypeAxisState(t);
    try {
      localStorage.setItem(TYPE_STORAGE_KEY, t);
    } catch {
      /* ignore */
    }
    writeCookie(TYPE_COOKIE_NAME, t);
  }, []);

  const setTrend = React.useCallback((t: Trend) => {
    setTrendState(t);
    try {
      localStorage.setItem(TREND_STORAGE_KEY, t);
    } catch {
      /* ignore */
    }
    writeCookie(TREND_COOKIE_NAME, t);
  }, []);

  const value = React.useMemo<ThemeContextValue>(
    () => ({
      theme,
      family: THEMES[theme].family,
      setTheme,
      isSystemDriven,
      resetToSystem,
      density,
      setDensity,
      mode,
      setMode,
      accent,
      setAccent,
      typeAxis,
      setTypeAxis,
      trend,
      setTrend,
    }),
    [
      theme,
      isSystemDriven,
      setTheme,
      resetToSystem,
      density,
      setDensity,
      mode,
      setMode,
      accent,
      setAccent,
      typeAxis,
      setTypeAxis,
      trend,
      setTrend,
    ],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

/**
 * Non-throwing variant for chrome that may render in any tree position —
 * including error boundaries, test environments, and future global-error.tsx
 * paths that bypass the root layout. Returns `null` when no provider is
 * present so the consumer can decide whether to render nothing or a stub.
 */
export function useThemeIfAvailable(): ThemeContextValue | null {
  return React.useContext(ThemeContext);
}
