"use client";

import { useThemeIfAvailable } from "@/app/theme/ThemeProvider";
import { useT } from "@/lib/i18n/LocaleProvider";

/**
 * Shell-wide density radio group — drives `data-density` on <html>. Three
 * modes per IA spec §5.4: compact (power-user tables), comfortable
 * (default), spacious (tablet / accessibility).
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
      key: "comfortable" as const,
      label: t("ui.density.comfortable", undefined, "Default"),
      aria: t("ui.density.comfortableAria", undefined, "Use comfortable density"),
    },
    {
      key: "spacious" as const,
      label: t("ui.density.spacious", undefined, "Spacious"),
      aria: t("ui.density.spaciousAria", undefined, "Use spacious density"),
    },
  ];
  return (
    <div
      className="inline-flex rounded-full border border-[var(--border-color)] bg-[var(--bg-secondary)] p-0.5"
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
              ? "bg-[var(--background)] text-[var(--foreground)]"
              : "text-[var(--text-muted)] hover:text-[var(--foreground)]"
          }`}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}
