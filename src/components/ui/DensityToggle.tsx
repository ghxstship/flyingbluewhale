"use client";

import { useThemeIfAvailable } from "@/app/theme/ThemeProvider";
import { useT } from "@/lib/i18n/LocaleProvider";

/**
 * Shell-wide density radio group — drives `data-density` on <html>. Kit v3
 * axis: compact (power-user tables) and cozy (default). `spacious` (tablet /
 * accessibility) is a documented codebase extension flagged for Claude Design.
 *
 * Paired with <ThemeToggle> in the platform glass nav and on the Settings
 * > Appearance page. Vocabulary matches Stripe Dashboard + Attio.
 */
export function DensityToggle() {
  // Audit B4: render nothing when no ThemeProvider is in the tree.
  const ctx = useThemeIfAvailable();
  const t = useT();
  if (!ctx) return null;
  const { density, setDensity } = ctx;
  const modes = [
    {
      key: "compact" as const,
      label: t("ui.density.compact", undefined, "Compact"),
      aria: t("ui.density.compactAria", undefined, "Use compact density"),
    },
    {
      key: "cozy" as const,
      label: t("ui.density.cozy", undefined, "Default"),
      aria: t("ui.density.cozyAria", undefined, "Use cozy density"),
    },
    {
      key: "spacious" as const,
      label: t("ui.density.spacious", undefined, "Spacious"),
      aria: t("ui.density.spaciousAria", undefined, "Use spacious density"),
    },
  ];
  return (
    <div
      className="inline-flex rounded-full border border-[var(--p-border)] bg-[var(--p-surface)] p-0.5"
      role="radiogroup"
      aria-label={t("ui.density.label", undefined, "Density")}
    >
      {modes.map((m) => (
        <button
          key={m.key}
          type="button"
          role="radio"
          aria-checked={density === m.key}
          aria-label={m.aria}
          onClick={() => setDensity(m.key)}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            density === m.key
              ? "bg-[var(--p-bg)] text-[var(--p-text-1)]"
              : "text-[var(--p-text-2)] hover:text-[var(--p-text-1)]"
          }`}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}
