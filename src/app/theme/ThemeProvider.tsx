"use client";

import * as React from "react";
import { THEMES, isValidThemeSlug, colorSchemeFor, type ThemeSlug, type ThemeFamily } from "./themes.config";
import { THEME_COOKIE_NAME, THEME_STORAGE_KEY } from "./theme-script";

export type ColorMode = "light" | "dark" | "system";

export interface ThemeContextValue {
  theme: ThemeSlug;
  family: ThemeFamily;
  setTheme: (slug: ThemeSlug) => void;
  /** True when the user hasn't picked a theme manually. */
  isSystemDriven: boolean;
  resetToSystem: () => void;
  /** Density is orthogonal to theme. */
  density: "comfortable" | "compact";
  setDensity: (d: "comfortable" | "compact") => void;
  /**
   * Color mode — orthogonal to the design theme slug. `system` honors
   * `prefers-color-scheme`. Applied as `data-mode` on <html>, independent
   * of the `data-theme` attribute that carries the CHROMA BEACON slug.
   */
  mode: ColorMode;
  setMode: (m: ColorMode) => void;
}

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

function writeCookie(key: string, value: string) {
  document.cookie = `${key}=${encodeURIComponent(value)}; max-age=${COOKIE_MAX_AGE}; path=/; samesite=lax`;
}

async function persistRemote(patch: { theme?: ThemeSlug; density?: "comfortable" | "compact" }) {
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
  if (typeof window === "undefined") return "kinetic";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "cyber" : "kinetic";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Initialize from the DOM attribute set by the head script — this is the
  // "mount" value. Storage (and any remote pref) reconcile in the first
  // effect to avoid hydration mismatch.
  const [theme, setThemeState] = React.useState<ThemeSlug>("kinetic");
  const [isSystemDriven, setSystemDriven] = React.useState(true);
  const [density, setDensityState] = React.useState<"comfortable" | "compact">("comfortable");
  const [mode, setModeState] = React.useState<ColorMode>("system");
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

    const d = (localStorage.getItem("chroma.density") as "comfortable" | "compact" | null) ?? "comfortable";
    setDensityState(d);

    // Color mode hydration — cookie first, then localStorage, then default "system".
    const cookieMode = (() => {
      const m = document.cookie.match(/(?:^|;\s*)fbw_mode=([^;]+)/);
      const v = m ? decodeURIComponent(m[1]) : null;
      return v === "light" || v === "dark" || v === "system" ? (v as ColorMode) : null;
    })();
    const storedMode = (() => {
      try {
        const v = localStorage.getItem("chroma.mode");
        return v === "light" || v === "dark" || v === "system" ? (v as ColorMode) : null;
      } catch {
        return null;
      }
    })();
    setModeState(cookieMode ?? storedMode ?? "system");

    setMounted(true);
  }, []);

  // Re-apply data-theme + color-scheme whenever theme changes client-side
  React.useEffect(() => {
    if (!mounted) return;
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.style.colorScheme = colorSchemeFor(theme);
  }, [theme, mounted]);

  React.useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    if (density === "compact") root.setAttribute("data-density", "compact");
    else root.removeAttribute("data-density");
  }, [density, mounted]);

  // Color mode application — independent of the theme slug. Writes
  // `data-mode="light|dark"` (resolving `system` against the media query)
  // so CSS can gate token overrides on that attribute without clobbering
  // `data-theme`. Also sets `color-scheme` so the UA picks scrollbars +
  // form controls that match.
  React.useEffect(() => {
    if (!mounted) return;
    const resolved = mode === "system"
      ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      : mode;
    document.documentElement.setAttribute("data-mode", resolved);
  }, [mode, mounted]);

  React.useEffect(() => {
    if (!mounted || mode !== "system") return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    function onChange() {
      const next = mql.matches ? "dark" : "light";
      document.documentElement.setAttribute("data-mode", next);
    }
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [mode, mounted]);

  // Cross-tab sync — listen for storage events from other tabs of the same app
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

  // System preference change — only applies while unpicked
  React.useEffect(() => {
    if (!mounted) return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    function onChange() {
      if (!isSystemDriven) return;
      const next = systemDefault();
      setThemeState(next);
    }
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [mounted, isSystemDriven]);

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

  const setDensity = React.useCallback((d: "comfortable" | "compact") => {
    setDensityState(d);
    try {
      localStorage.setItem("chroma.density", d);
    } catch {
      /* ignore */
    }
    writeCookie("fbw_density", d);
    void persistRemote({ density: d });
  }, []);

  const setMode = React.useCallback((m: ColorMode) => {
    setModeState(m);
    try {
      localStorage.setItem("chroma.mode", m);
    } catch {
      /* ignore */
    }
    writeCookie("fbw_mode", m);
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
    }),
    [theme, isSystemDriven, setTheme, resetToSystem, density, setDensity, mode, setMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within CHROMA BEACON ThemeProvider");
  return ctx;
}
