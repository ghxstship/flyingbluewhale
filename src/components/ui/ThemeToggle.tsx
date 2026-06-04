"use client";

import { Sun, Monitor, Moon } from "lucide-react";
import { useThemeIfAvailable } from "@/app/theme/ThemeProvider";
import { Hint } from "@/components/ui/Tooltip";
import { useT } from "@/lib/i18n/LocaleProvider";

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
  // Audit B4: render nothing when no ThemeProvider is in the tree
  // (e.g., error boundaries or test environments). Was crashing the app
  // via a thrown error; the toggle is chrome — its absence is benign.
  const ctx = useThemeIfAvailable();
  const t = useT();
  if (!ctx) return null;
  const { mode, setMode } = ctx;

  const presets = [
    { key: "light" as const, icon: Sun, label: t("theme.toggle.light", undefined, "Light") },
    { key: "system" as const, icon: Monitor, label: t("theme.toggle.system", undefined, "Match system") },
    { key: "dark" as const, icon: Moon, label: t("theme.toggle.dark", undefined, "Dark") },
  ];

  return (
    <div
      className="inline-flex rounded-full border border-[var(--border-color)] bg-[var(--bg-secondary)] p-0.5"
      role="radiogroup"
      aria-label={t("theme.toggle.colorTheme", undefined, "Color mode")}
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
              className={`inline-flex h-7 w-7 items-center justify-center rounded-full transition-colors ${
                isActive
                  ? "bg-[var(--background)] text-[var(--foreground)]"
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
