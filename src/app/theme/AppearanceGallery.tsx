"use client";

import * as React from "react";
import { Check, Monitor } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { THEME_SLUGS, THEMES, type ThemeSlug } from "./themes.config";
import { useAnnounce } from "@/components/ui/LiveRegion";

/**
 * CHROMA BEACON — Appearance Gallery.
 * Radiogroup of 8 live theme previews. Each card renders inside its own
 * [data-theme] scope, so the preview IS the theme.
 *
 * Benchmark: Linear Appearance settings (8 themes is beyond Linear's 3,
 * so we lean on Radix radiogroup semantics + arrow-key nav for keyboard
 * parity with Linear's picker).
 */
export function AppearanceGallery() {
  const { theme, setTheme, isSystemDriven, resetToSystem } = useTheme();
  const announce = useAnnounce();
  const [focusedIdx, setFocusedIdx] = React.useState(() => Math.max(0, THEME_SLUGS.indexOf(theme)));

  function select(slug: ThemeSlug) {
    setTheme(slug);
    announce(`${THEMES[slug].label} applied. ${THEMES[slug].essence}`, "polite");
  }

  function onKey(e: React.KeyboardEvent, idx: number) {
    let next = idx;
    if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (idx - 1 + THEME_SLUGS.length) % THEME_SLUGS.length;
    else if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (idx + 1) % THEME_SLUGS.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = THEME_SLUGS.length - 1;
    else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      select(THEME_SLUGS[idx]);
      return;
    } else {
      return;
    }
    e.preventDefault();
    setFocusedIdx(next);
    cardsRef.current[next]?.focus();
  }

  const cardsRef = React.useRef<(HTMLButtonElement | null)[]>([]);

  return (
    <section aria-labelledby="appearance-heading" className="space-y-4">
      <header>
        <h2 id="appearance-heading" className="text-xl font-semibold tracking-tight">
          Appearance
        </h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Pick a look for your workspace. Applies instantly everywhere.
        </p>
      </header>

      <div
        role="radiogroup"
        aria-label="Theme"
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
      >
        {THEME_SLUGS.map((slug, idx) => {
          const def = THEMES[slug];
          const active = theme === slug;
          return (
            <button
              key={slug}
              ref={(el) => {
                cardsRef.current[idx] = el;
              }}
              role="radio"
              aria-checked={active}
              tabIndex={active || (focusedIdx === idx && !THEME_SLUGS.includes(theme)) ? 0 : -1}
              data-theme={slug}
              onClick={() => select(slug)}
              onFocus={() => setFocusedIdx(idx)}
              onKeyDown={(e) => onKey(e, idx)}
              className={`theme-card group relative overflow-hidden text-start outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-[var(--accent-solid,var(--accent))] ${
                active ? "ring-2 ring-[var(--accent-solid,var(--accent))]" : ""
              }`}
              style={{
                background: "var(--bg-hero, var(--bg))",
                border: "var(--border-width) solid var(--border)",
                borderRadius: "var(--radius-md)",
                color: "var(--text)",
                boxShadow: "var(--shadow-elev)",
                fontFamily: "var(--font-body)",
                transition: "transform 180ms cubic-bezier(0,0,0.2,1), box-shadow 180ms",
              }}
            >
              <ThemePreview slug={slug} />
              <div className="relative p-4">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className="text-sm font-semibold"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {def.label}
                  </span>
                  {active && (
                    <span
                      aria-hidden="true"
                      className="inline-flex h-5 w-5 items-center justify-center rounded-full"
                      style={{
                        background: "var(--accent-solid, var(--accent))",
                        color: "var(--accent-contrast)",
                      }}
                    >
                      <Check size={12} strokeWidth={3} />
                    </span>
                  )}
                </div>
                <p
                  className="mt-1 text-xs"
                  style={{ color: "var(--text-muted)" }}
                >
                  {def.essence}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={resetToSystem}
          disabled={isSystemDriven}
          className="inline-flex items-center gap-2 rounded-md border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--text-muted)] hover:bg-[var(--surface-2)] disabled:opacity-40"
        >
          <Monitor size={12} aria-hidden="true" />
          <span>{isSystemDriven ? "Matching system" : "Match system"}</span>
        </button>
        <div className="text-xs text-[var(--text-muted)]">
          Currently: <span className="font-medium text-[var(--text)]">{THEMES[theme].label}</span>
        </div>
      </div>
    </section>
  );
}

/**
 * Tiny theme-accurate preview: surface tile + text glyph + accent chip
 * inside each card's [data-theme] scope (inherits the theme's tokens).
 */
function ThemePreview({ slug }: { slug: ThemeSlug }) {
  return (
    <div
      aria-hidden="true"
      className="relative aspect-[3/2] overflow-hidden"
      style={{
        background: "var(--bg-hero, var(--bg))",
      }}
    >
      {/* Translucent card on top of the theme's bg */}
      <div
        className="absolute inset-3 overflow-hidden p-2"
        style={{
          background: "var(--surface)",
          border: "var(--border-width) solid var(--border)",
          borderRadius: "var(--radius-sm)",
          boxShadow: "var(--shadow-elev)",
          backdropFilter: slug === "glass" ? "blur(20px) saturate(180%)" : undefined,
        }}
      >
        <div
          className="text-[11px] font-semibold"
          style={{ fontFamily: "var(--font-display)", color: "var(--text)" }}
        >
          Aa
        </div>
        <div className="mt-1 h-1 w-10" style={{ background: "var(--text-muted)", opacity: 0.4 }} />
        <div className="mt-1 h-1 w-6" style={{ background: "var(--text-muted)", opacity: 0.3 }} />
        <div
          className="absolute bottom-1.5 end-1.5 inline-flex h-3 w-6 rounded-full"
          style={{
            background: "var(--accent-solid, var(--accent))",
          }}
        />
      </div>
    </div>
  );
}
