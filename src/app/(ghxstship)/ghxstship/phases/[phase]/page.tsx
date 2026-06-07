import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { PHASES, PHASE_BY_SLUG, CLASS_BY_CODE, resolveServices, paths } from "@/lib/ghxstship";
import type { PhaseSlug } from "@/lib/ghxstship/types";
import { GhxstshipJsonLd, breadcrumbSchema } from "@/components/ghxstship/JsonLd";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-static";

export function generateStaticParams() {
  return PHASES.map((p) => ({ phase: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ phase: string }> }): Promise<Metadata> {
  const { phase } = await params;
  const p = PHASE_BY_SLUG[phase as PhaseSlug];
  if (!p) return {};
  const { t } = await getRequestT();
  return {
    title: t("ghxstship.phase.meta.title", { name: p.name }, "{name} Phase — Production Services | GHXSTSHIP"),
    description: p.buyerIntent,
    alternates: { canonical: `https://ghxstship.pro/ghxstship/phases/${p.slug}` },
  };
}

export default async function PhaseDetail({ params }: { params: Promise<{ phase: string }> }) {
  const { phase } = await params;
  const p = PHASE_BY_SLUG[phase as PhaseSlug];
  if (!p) notFound();
  const { t } = await getRequestT();
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
          <nav className="mb-6 text-xs text-[var(--p-text-2)]">
            <Link href={paths.phasesRoot()} className="hover:text-[var(--p-text-1)]">
              {t("ghxstship.phase.crumb", undefined, "Phases")}
            </Link>
            <span className="mx-2">/</span>
            <span className="text-[var(--p-text-1)]">{p.name}</span>
          </nav>
          <div className="font-mono text-[10px] tracking-[0.2em] text-[var(--p-text-2)]">
            {t("ghxstship.phase.counter", { number: p.number }, "Phase {number} of 08")}
          </div>
          <h1 className="mt-3 text-5xl uppercase sm:text-7xl" style={{ fontFamily: "var(--font-display)" }}>
            {p.name}
          </h1>
          <p className="mt-6 max-w-3xl text-lg text-[var(--p-text-2)]">{p.buyerIntent}</p>
        </section>

        <section className="mx-auto max-w-6xl px-6">
          <div className="surface p-6">
            <div className="text-xs font-semibold tracking-[0.18em] uppercase" style={{ color: "var(--p-accent)" }}>
              {t("ghxstship.phase.whatHappens", undefined, "What happens in this phase")}
            </div>
            <p className="mt-3 text-[var(--p-text-2)]">{p.whatHappens}</p>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6">
          <div className="text-xs font-semibold tracking-[0.2em] text-[var(--p-text-2)] uppercase">
            {t(
              "ghxstship.phase.servicesActive",
              { count: services.length, name: p.name },
              "{count} services active in {name}",
            )}
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
                    <span className="font-mono text-[10px] tracking-wider text-[var(--p-text-2)]">
                      {String(s.number).padStart(3, "0")}
                    </span>
                    <div>
                      <div className="text-sm">{s.name}</div>
                      <div className="text-[10px] text-[var(--p-text-2)] uppercase">{c.shortName}</div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="mx-auto max-w-6xl px-6">
          <div className="surface flex flex-wrap items-center justify-between gap-3 p-6">
            <div className="text-sm text-[var(--p-text-2)]">
              {t("ghxstship.phase.moveThrough", undefined, "Move through the lifecycle")}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {PHASES.map((other) => {
                const isCurrent = other.slug === p.slug;
                return (
                  <Link
                    key={other.slug}
                    href={paths.phaseDetail(other.slug)}
                    className={isCurrent ? "ps-btn ps-btn--sm" : "ps-btn ps-btn--ghost ps-btn--sm"}
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
