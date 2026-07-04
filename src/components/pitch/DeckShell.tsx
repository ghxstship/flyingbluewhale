"use client";

// DeckShell — full-screen deck driver.
//
// Renders one slide at a time inside a centered 16:9 stage. Keyboard nav:
//   ← / → / Space / PageUp / PageDown   step
//   Home / End                          first / last
//   Esc                                 exit (history back)
// Progress dots are clickable; a slide counter sits in the corner. The
// active slide lives in an aria-live region so a screen reader announces
// "Slide N of M" on each step. All paint routes through --p-* tokens.
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function DeckShell({ slides, label = "Pitch deck" }: { slides: React.ReactNode[]; label?: string }) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const count = slides.length;

  const go = useCallback((next: number) => setIndex(Math.min(Math.max(next, 0), count - 1)), [count]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      switch (e.key) {
        case "ArrowRight":
        case " ":
        case "PageDown":
          e.preventDefault();
          go(index + 1);
          break;
        case "ArrowLeft":
        case "PageUp":
          e.preventDefault();
          go(index - 1);
          break;
        case "Home":
          e.preventDefault();
          go(0);
          break;
        case "End":
          e.preventDefault();
          go(count - 1);
          break;
        case "Escape":
          e.preventDefault();
          router.back();
          break;
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, count, go, router]);

  const atStart = index === 0;
  const atEnd = index === count - 1;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[var(--p-bg)]">
      {/* Top bar: label · counter · exit */}
      <header className="flex flex-none items-center justify-between px-5 py-3">
        <span className="text-[11px] font-semibold tracking-[0.16em] text-[var(--p-text-3)] uppercase">{label}</span>
        <div className="flex items-center gap-4">
          <span className="font-mono text-xs tabular-nums text-[var(--p-text-2)]">
            {String(index + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
          </span>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-md border border-[var(--p-border-2)] px-3 py-1.5 text-xs font-semibold text-[var(--p-text-1)] transition-colors hover:bg-[var(--p-surface-2)]"
          >
            Exit
          </button>
        </div>
      </header>

      {/* Stage */}
      <main className="flex min-h-0 flex-1 items-center justify-center px-4 sm:px-12">
        <div
          role="region"
          aria-roledescription="slide"
          aria-label={`Slide ${index + 1} of ${count}`}
          aria-live="polite"
          className="w-full max-w-[min(92vw,calc(82vh*16/9))]"
        >
          {slides[index]}
        </div>
      </main>

      {/* Bottom bar: prev · dots · next */}
      <footer className="flex flex-none items-center justify-between gap-4 px-5 py-4">
        <button
          type="button"
          onClick={() => go(index - 1)}
          disabled={atStart}
          aria-label="Previous slide"
          className="rounded-md border border-[var(--p-border-2)] px-3 py-1.5 text-sm font-semibold text-[var(--p-text-1)] transition-colors hover:bg-[var(--p-surface-2)] disabled:opacity-40"
        >
          ←
        </button>
        <div className="flex flex-wrap items-center justify-center gap-2" role="tablist" aria-label="Slides">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => go(i)}
              className={`h-2 rounded-full transition-[width,background-color] ${
                i === index ? "w-6 bg-[var(--p-accent)]" : "w-2 bg-[var(--p-border-2)] hover:bg-[var(--p-text-3)]"
              }`}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => go(index + 1)}
          disabled={atEnd}
          aria-label="Next slide"
          className="rounded-md border border-[var(--p-border-2)] px-3 py-1.5 text-sm font-semibold text-[var(--p-text-1)] transition-colors hover:bg-[var(--p-surface-2)] disabled:opacity-40"
        >
          →
        </button>
      </footer>
    </div>
  );
}
