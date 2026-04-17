"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";
type Density = "comfortable" | "compact";

interface ThemeState {
  theme: Theme;
  density: Density;
  setTheme: (t: Theme) => void;
  setDensity: (d: Density) => void;
}

const initial: ThemeState = {
  theme: "system",
  density: "comfortable",
  setTheme: () => {},
  setDensity: () => {},
};

const Ctx = createContext<ThemeState>(initial);

export function ThemeProvider({
  children,
  defaultTheme = "system",
}: {
  children: React.ReactNode;
  defaultTheme?: Theme;
}) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [density, setDensityState] = useState<Density>("comfortable");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = (localStorage.getItem("fbw_theme") as Theme | null) ?? defaultTheme;
    const d = (localStorage.getItem("fbw_density") as Density | null) ?? "comfortable";
    setThemeState(t);
    setDensityState(d);
    setMounted(true);
  }, [defaultTheme]);

  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    const resolved =
      theme === "system"
        ? matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
        : theme;
    root.setAttribute("data-theme", resolved);
  }, [theme, mounted]);

  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    if (density === "compact") root.setAttribute("data-density", "compact");
    else root.removeAttribute("data-density");
  }, [density, mounted]);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    localStorage.setItem("fbw_theme", t);
  };

  const setDensity = (d: Density) => {
    setDensityState(d);
    localStorage.setItem("fbw_density", d);
  };

  return <Ctx.Provider value={{ theme, density, setTheme, setDensity }}>{children}</Ctx.Provider>;
}

export const useTheme = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
};
