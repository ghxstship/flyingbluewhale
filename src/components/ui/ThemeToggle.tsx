"use client";

import { Sun, Monitor, Moon } from "lucide-react";
import { useTheme } from "@/app/theme/ThemeProvider";
import { Hint } from "@/components/ui/Tooltip";

/**
 * Light / System / Dark mode picker — icon-only segmented control.
 *
 * CHROMA BEACON intent: **mode is orthogonal to palette.** The user picks
 * a palette (brutal/bento/…/kinetic/cyber) independently via the
 * Appearance gallery. This toggle flips `data-mode` between
 * light / dark / system **without changing the palette slug**.
 *
 * Each of the eight palettes ships both `[data-theme="X"]` (light) and
 * `[data-theme="X"][data-mode="dark"]` (dark) overrides, so every
 * palette renders correctly in both modes.
 */
export function ThemeToggle() {
  const { mode, setMode } = useTheme();

  const presets = [
    { key: "light" as const, icon: Sun, label: "Light" },
    { key: "system" as const, icon: Monitor, label: "Match system" },
    { key: "dark" as const, icon: Moon, label: "Dark" },
  ];

  return (
    <div
      className="inline-flex rounded-full border border-[var(--border-color)] bg-[var(--bg-secondary)] p-0.5"
      role="radiogroup"
      aria-label="Color mode"
    >
      {presets.map(({ key, icon: Icon, label }) => {
        const isActive = mode === key;
        return (
          <Hint key={key} label={label}>
            <button
              type="button"
              role="radio"
              aria-checked={isActive}
              aria-label={label}
              onClick={() => setMode(key)}
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
