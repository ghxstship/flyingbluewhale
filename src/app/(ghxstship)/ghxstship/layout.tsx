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
 * GHXSTSHIP marketing surface. Theme is LOCKED to bermuda-triangle here so
 * the brand identity (Anton display, cream paper, ink line, 3px borders)
 * holds regardless of which CHROMA theme the visitor has selected elsewhere
 * on the parent property. Bioluminescent green accent applies via
 * data-platform="ghxstship".
 *
 * `data-mode` is intentionally NOT set so the wrapper always reads as the
 * light-family bermuda-triangle paint (paper / ink), even when the parent
 * `<html>` is in dark mode for the SaaS surface.
 */
export default function GhxstshipLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      data-theme="bermuda-triangle"
      data-platform="ghxstship"
      data-mode="light"
      className="page-shell min-h-screen"
    >
      <GhxstshipHeader />
      <main>{children}</main>
      <GhxstshipFooter />
    </div>
  );
}
