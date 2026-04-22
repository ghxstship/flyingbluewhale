"use client";

import { Sun, Monitor, Moon } from "lucide-react";
import { useTheme } from "@/app/theme/ThemeProvider";
import { Hint } from "@/components/ui/Tooltip";

/**
 * Light / System / Dark quick-preset picker — icon-only segmented control.
 *
 * CHROMA BEACON intent: every design theme ships its own canonical palette,
 * so "dark mode" is a specific theme (`cyber`), not a generic filter. This
 * toggle treats Sun/Monitor/Moon as **preset selectors** over the theme
 * slug itself:
 *
 *   Sun     → switch to `kinetic` (canonical light theme)
 *   Monitor → reset to system preference (kinetic on light OS, cyber on dark)
 *   Moon    → switch to `cyber`   (canonical dark theme)
 *
 * Users who want non-default themes (brutal, bento, glass, etc.) pick from
 * the full gallery via the Themes palette icon. This toggle is for the
 * 80% SaaS-quick-switch use case.
 */
export function ThemeToggle() {
  const { theme, setTheme, isSystemDriven, resetToSystem } = useTheme();

  const active: "light" | "dark" | "system" = isSystemDriven
    ? "system"
    : theme === "cyber" || theme === "glass"
      ? "dark"
      : "light";

  const presets = [
    { key: "light", icon: Sun, label: "Light", apply: () => setTheme("kinetic") },
    { key: "system", icon: Monitor, label: "Match system", apply: () => resetToSystem() },
    { key: "dark", icon: Moon, label: "Dark", apply: () => setTheme("cyber") },
  ] as const;

  return (
    <div
      className="inline-flex rounded-full border border-[var(--border-color)] bg-[var(--bg-secondary)] p-0.5"
      role="radiogroup"
      aria-label="Color theme"
    >
      {presets.map(({ key, icon: Icon, label, apply }) => {
        const isActive = active === key;
        return (
          <Hint key={key} label={label}>
            <button
              type="button"
              role="radio"
              aria-checked={isActive}
              aria-label={label}
              onClick={apply}
              className={`inline-flex h-7 w-7 items-center justify-center rounded-full transition ${
                isActive
                  ? "bg-[var(--background)] text-[var(--foreground)] elevation-1"
                  : "text-[var(--text-muted)] hover:text-[var(--foreground)]"
              }`}
            >
              <Icon size={13} aria-hidden="true" />
            </button>
          </Hint>
        );
      })}
    </div>
  );
}
