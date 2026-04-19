"use client";

import { useTheme } from "@/app/theme/ThemeProvider";

/**
 * Shell-wide density radio group — drives `data-density` on <html>. Three
 * modes per IA spec §5.4: compact (power-user tables), comfortable
 * (default), spacious (tablet / accessibility).
 *
 * Paired with <ThemeToggle> in the platform glass nav and on the Settings
 * > Appearance page. Vocabulary matches Stripe Dashboard + Attio.
 */
export function DensityToggle() {
  const { density, setDensity } = useTheme();
  const modes = [
    { key: "compact" as const, label: "Compact", aria: "Use compact density" },
    { key: "comfortable" as const, label: "Default", aria: "Use comfortable density" },
    { key: "spacious" as const, label: "Spacious", aria: "Use spacious density" },
  ];
  return (
    <div
      className="inline-flex rounded-full border border-[var(--border-color)] bg-[var(--bg-secondary)] p-0.5"
      role="radiogroup"
      aria-label="Density"
    >
      {modes.map((m) => (
        <button
          key={m.key}
          type="button"
          role="radio"
          aria-checked={density === m.key}
          aria-label={m.aria}
          onClick={() => setDensity(m.key)}
          className={`rounded-full px-3 py-1 text-xs font-medium transition ${
            density === m.key
              ? "bg-[var(--background)] text-[var(--foreground)] elevation-1"
              : "text-[var(--text-muted)] hover:text-[var(--foreground)]"
          }`}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}
