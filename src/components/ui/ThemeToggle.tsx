"use client";

import { useTheme } from "@/components/providers/ThemeProvider";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const modes: Array<{ key: "light" | "system" | "dark"; label: string }> = [
    { key: "light", label: "Light" },
    { key: "system", label: "Auto" },
    { key: "dark", label: "Dark" },
  ];
  return (
    <div className="inline-flex rounded-full border border-[var(--border-color)] bg-[var(--bg-secondary)] p-0.5">
      {modes.map((m) => (
        <button
          key={m.key}
          type="button"
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
