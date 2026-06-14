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
 * GHXSTSHIP parent-company marketing surface. Adopts the canonical ATLVS
 * kit skin (MONUMENT type — Anton/Hanken Grotesk, neutral light/dark surfaces,
 * brass accent via compvss data-product) for visual continuity with the platform.
 * The pre-kit cosmic `ghxstship` skin (Big Shoulders, void ink ground,
 * halftone dots) was retired in the kit-only refactor.
 */
export default function GhxstshipLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      data-ui="saas"
      data-theme="atlvs-product"
      data-product="compvss"
      data-platform="ghxstship"
      className="page-shell min-h-screen"
      style={{
        background: "var(--p-bg)",
        color: "var(--p-text-1)",
        fontFamily: "var(--font-body)",
      }}
    >
      <GhxstshipHeader />
      <main id="main" tabIndex={-1}>
        {children}
      </main>
      <GhxstshipFooter />
    </div>
  );
}
