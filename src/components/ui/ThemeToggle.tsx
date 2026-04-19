"use client";

import { useTheme } from "@/app/theme/ThemeProvider";

export function ThemeToggle() {
  // Color mode is orthogonal to the CHROMA BEACON design theme. This toggle
  // controls ONLY the mode (`light|dark|system`) — picking a design theme
  // happens in the AppearanceGallery sheet in the header.
  const { mode: theme, setMode: setTheme } = useTheme();
  // Vocabulary aligned with Stripe / GitHub / Linear: "System", not "Auto".
  // Same internal value (`system`), cleaner first-time-visitor read.
  const modes: Array<{ key: "light" | "system" | "dark"; label: string; aria: string }> = [
    { key: "light", label: "Light", aria: "Use light theme" },
    { key: "system", label: "System", aria: "Match system theme" },
    { key: "dark", label: "Dark", aria: "Use dark theme" },
  ];
  return (
    <div
      className="inline-flex rounded-full border border-[var(--border-color)] bg-[var(--bg-secondary)] p-0.5"
      role="radiogroup"
      aria-label="Color theme"
    >
      {modes.map((m) => (
        <button
          key={m.key}
          type="button"
          role="radio"
          aria-checked={theme === m.key}
          aria-label={m.aria}
          onClick={() => setTheme(m.key)}
          className={`rounded-full px-3 py-1 text-xs font-medium transition ${
            theme === m.key
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
