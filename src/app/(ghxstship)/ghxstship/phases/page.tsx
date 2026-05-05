import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PHASES, paths } from "@/lib/ghxstship";
import { GhxstshipJsonLd, breadcrumbSchema } from "@/components/ghxstship/JsonLd";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Production Phases — Discovery to Wrap | GHXSTSHIP",
  description:
    "Eight production phases. Discovery, Concept, Develop, Advance, Build, Show, Strike, Wrap. Engage across the full lifecycle or any subset.",
  alternates: { canonical: "https://ghxstship.pro/ghxstship/phases" },
};

export default function PhasesHub() {
  return (
    <>
      <GhxstshipJsonLd
        data={breadcrumbSchema([
          { label: "GHXSTSHIP", href: "/ghxstship" },
          { label: "Phases", href: "/ghxstship/phases" },
        ])}
      />
      <div className="space-y-16 pb-24">
        <section className="mx-auto max-w-6xl px-6 pt-16">
          <div className="text-xs font-semibold tracking-[0.25em] uppercase" style={{ color: "var(--org-primary)" }}>
            Production Phases
          </div>
          <h1 className="mt-4 text-5xl uppercase sm:text-7xl" style={{ fontFamily: "var(--font-display)" }}>
            Discovery to Wrap.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-[var(--text-secondary)]">
            Every production touches some or all of eight phases. Use the phase pages to understand what we do and when
            — what gets decided in Discovery, what ships in Build, what closes in Wrap. Engage end to end or scope us
            into a single phase where you need the lift.
          </p>
        </section>

        <section className="mx-auto max-w-6xl px-6">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {PHASES.map((p) => (
              <Link
                key={p.slug}
                href={paths.phaseDetail(p.slug)}
                className="surface hover-lift group flex h-full flex-col p-6"
              >
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-[10px] tracking-[0.18em] text-[var(--text-muted)]">
                    Phase {p.number}
                  </span>
                </div>
                <span className="mt-2 text-xl uppercase" style={{ fontFamily: "var(--font-display)" }}>
                  {p.name}
                </span>
                <p className="mt-3 line-clamp-3 text-sm text-[var(--text-secondary)]">{p.buyerIntent}</p>
                <div className="mt-4 flex items-center gap-2 text-[10px] font-semibold tracking-[0.2em] uppercase">
                  <span className="text-[var(--text-muted)]">{p.activeServices.length} services</span>
                  <ArrowRight className="ml-auto h-3 w-3 text-[var(--text-muted)] group-hover:text-[var(--org-primary)]" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
