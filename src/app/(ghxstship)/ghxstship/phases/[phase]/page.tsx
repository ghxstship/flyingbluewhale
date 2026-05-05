import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { PHASES, PHASE_BY_SLUG, CLASS_BY_CODE, resolveServices, paths } from "@/lib/ghxstship";
import type { PhaseSlug } from "@/lib/ghxstship/types";
import { GhxstshipJsonLd, breadcrumbSchema } from "@/components/ghxstship/JsonLd";

export const dynamic = "force-static";

export function generateStaticParams() {
  return PHASES.map((p) => ({ phase: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ phase: string }> }): Promise<Metadata> {
  const { phase } = await params;
  const p = PHASE_BY_SLUG[phase as PhaseSlug];
  if (!p) return {};
  return {
    title: `${p.name} Phase — Production Services | GHXSTSHIP`,
    description: p.buyerIntent,
    alternates: { canonical: `https://ghxstship.pro/ghxstship/phases/${p.slug}` },
  };
}

export default async function PhaseDetail({ params }: { params: Promise<{ phase: string }> }) {
  const { phase } = await params;
  const p = PHASE_BY_SLUG[phase as PhaseSlug];
  if (!p) notFound();
  const services = resolveServices(p.activeServices);

  return (
    <>
      <GhxstshipJsonLd
        data={breadcrumbSchema([
          { label: "GHXSTSHIP", href: "/ghxstship" },
          { label: "Phases", href: "/ghxstship/phases" },
          { label: p.name, href: paths.phaseDetail(p.slug) },
        ])}
      />
      <div className="space-y-16 pb-24">
        <section className="mx-auto max-w-6xl px-6 pt-12">
          <nav className="mb-6 text-xs text-[var(--text-muted)]">
            <Link href={paths.phasesRoot()} className="hover:text-[var(--text-primary)]">
              Phases
            </Link>
            <span className="mx-2">/</span>
            <span className="text-[var(--text-primary)]">{p.name}</span>
          </nav>
          <div className="font-mono text-[10px] tracking-[0.2em] text-[var(--text-muted)]">Phase {p.number} of 08</div>
          <h1 className="mt-3 text-5xl uppercase sm:text-7xl" style={{ fontFamily: "var(--font-display)" }}>
            {p.name}
          </h1>
          <p className="mt-6 max-w-3xl text-lg text-[var(--text-secondary)]">{p.buyerIntent}</p>
        </section>

        <section className="mx-auto max-w-6xl px-6">
          <div className="surface p-6">
            <div className="text-xs font-semibold tracking-[0.18em] uppercase" style={{ color: "var(--org-primary)" }}>
              What happens in this phase
            </div>
            <p className="mt-3 text-[var(--text-secondary)]">{p.whatHappens}</p>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6">
          <div className="text-xs font-semibold tracking-[0.2em] text-[var(--text-muted)] uppercase">
            {services.length} services active in {p.name}
          </div>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => {
              const c = CLASS_BY_CODE[s.primaryClass];
              return (
                <li key={s.number}>
                  <Link
                    href={paths.serviceDetail(c.slug, s.slug)}
                    className="surface hover-lift flex h-full items-start gap-3 p-4"
                  >
                    <span className="font-mono text-[10px] tracking-wider text-[var(--text-muted)]">
                      {String(s.number).padStart(3, "0")}
                    </span>
                    <div>
                      <div className="text-sm">{s.name}</div>
                      <div className="text-[10px] text-[var(--text-muted)] uppercase">{c.shortName}</div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="mx-auto max-w-6xl px-6">
          <div className="surface flex flex-wrap items-center justify-between gap-3 p-6">
            <div className="text-sm text-[var(--text-secondary)]">Move through the lifecycle</div>
            <div className="flex flex-wrap items-center gap-2">
              {PHASES.map((other) => {
                const isCurrent = other.slug === p.slug;
                return (
                  <Link
                    key={other.slug}
                    href={paths.phaseDetail(other.slug)}
                    className={isCurrent ? "btn btn-primary btn-sm" : "btn btn-secondary btn-sm"}
                    title={other.name}
                  >
                    {other.name}
                    {!isCurrent && <ArrowRight className="h-3 w-3" />}
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
