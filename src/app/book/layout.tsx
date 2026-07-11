import type { ReactNode } from "react";

/**
 * Public booking surface (kit 27, Phase 4) — token-reached, no auth, no
 * shell chrome. Mirrors the /offer token-page pattern.
 */
export const metadata = {
  title: "Book a Time",
  robots: { index: false, follow: false },
};

export default function BookLayout({ children }: { children: ReactNode }) {
  return (
    <div data-platform="atlvs" className="min-h-screen bg-[var(--p-bg)] text-[var(--p-text-1)]">
      <main className="mx-auto max-w-3xl px-4 py-10">{children}</main>
    </div>
  );
}
