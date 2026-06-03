import type { Metadata } from "next";
import { GhxstshipHeader } from "@/components/ghxstship/Header";
import { GhxstshipFooter } from "@/components/ghxstship/Footer";

export const metadata: Metadata = {
  title: {
    default: "GHXSTSHIP — Experiential Production Company",
    template: "%s — GHXSTSHIP",
  },
  description:
    "GHXSTSHIP is an experiential production company building festivals, immersive experiences, theme parks, theatrical performances, brand activations, and premium hospitality across Miami, New York City, Chicago, and Los Angeles.",
};

/**
 * GHXSTSHIP marketing surface. Theme is LOCKED to the cosmic `ghxstship`
 * skin (Big Shoulders display, void ink ground, brass doubloon accent,
 * halftone dots, hard-offset shadows) regardless of any preference
 * inherited from the parent property — this surface IS the GHXSTSHIP
 * brand expression. Brass-default accent applies via data-platform.
 *
 * Pre-v3 this layout pinned the now-purged `bermuda-triangle` skin; that
 * was a legacy reference replaced in the v3 brand sweep.
 */
export default function GhxstshipLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      data-theme="ghxstship"
      data-platform="ghxstship"
      className="page-shell min-h-screen"
      style={{
        background: "var(--bg)",
        color: "var(--text)",
        fontFamily: "var(--font-body)",
      }}
    >
      <GhxstshipHeader />
      <main>{children}</main>
      <GhxstshipFooter />
    </div>
  );
}
