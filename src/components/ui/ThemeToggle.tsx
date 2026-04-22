"use client";

import { Sun, Monitor, Moon } from "lucide-react";
import { useTheme } from "@/app/theme/ThemeProvider";
import { Hint } from "@/components/ui/Tooltip";

/**
 * Color-mode toggle — icon-only segmented control matching the SaaS chrome
 * convention (Linear, Vercel, Stripe dashboard). Sun / Monitor / Moon with
 * tooltips; aria-labels carry the spoken label for screen readers so no
 * meaning is lost when visual labels are removed.
 *
 * Color mode is orthogonal to the CHROMA BEACON design theme — this only
 * controls light/dark; design theme lives in the AppearanceGallery sheet.
 */
export function ThemeToggle() {
  const { mode: theme, setMode: setTheme } = useTheme();
  const modes = [
    { key: "light", icon: Sun, label: "Light" },
    { key: "system", icon: Monitor, label: "System" },
    { key: "dark", icon: Moon, label: "Dark" },
  ] as const;
  return (
    <div
      className="inline-flex rounded-full border border-[var(--border-color)] bg-[var(--bg-secondary)] p-0.5"
      role="radiogroup"
      aria-label="Color theme"
    >
      {modes.map(({ key, icon: Icon, label }) => {
        const active = theme === key;
        return (
          <Hint key={key} label={label}>
            <button
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={label}
              onClick={() => setTheme(key)}
              className={`inline-flex h-7 w-7 items-center justify-center rounded-full transition ${
                active
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
