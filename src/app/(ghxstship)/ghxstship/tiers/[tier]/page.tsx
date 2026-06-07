import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TIERS, TIER_BY_SLUG, CLASS_BY_CODE, resolveServices, paths } from "@/lib/ghxstship";
import type { TierSlug } from "@/lib/ghxstship/types";
import { GhxstshipJsonLd, breadcrumbSchema } from "@/components/ghxstship/JsonLd";

export const dynamic = "force-static";

export function generateStaticParams() {
  return TIERS.map((t) => ({ tier: t.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ tier: string }> }): Promise<Metadata> {
  const { tier } = await params;
  const t = TIER_BY_SLUG[tier as TierSlug];
  if (!t) return {};
  return {
    title: `${t.name} Experiences — Production Services | GHXSTSHIP`,
    description: t.definition,
    alternates: { canonical: `https://ghxstship.pro/ghxstship/tiers/${t.slug}` },
  };
}

export default async function TierDetail({ params }: { params: Promise<{ tier: string }> }) {
  const { tier } = await params;
  const t = TIER_BY_SLUG[tier as TierSlug];
  if (!t) notFound();
  const services = resolveServices(t.anchoredServices);

  return (
    <>
      <GhxstshipJsonLd
        data={breadcrumbSchema([
          { label: "GHXSTSHIP", href: "/ghxstship" },
          { label: "Experience Modes", href: "/ghxstship/tiers" },
          { label: t.name, href: paths.tierDetail(t.slug) },
        ])}
      />
      <div className="space-y-16 pb-24">
        <section className="mx-auto max-w-6xl px-6 pt-12">
          <nav className="mb-6 text-xs text-[var(--p-text-2)]">
            <Link href={paths.tiersRoot()} className="hover:text-[var(--p-text-1)]">
              Experience Modes
            </Link>
            <span className="mx-2">/</span>
            <span className="text-[var(--p-text-1)]">{t.name}</span>
          </nav>
          <h1 className="text-5xl uppercase sm:text-7xl" style={{ fontFamily: "var(--font-display)" }}>
            {t.name}
          </h1>
          <p className="mt-6 max-w-3xl text-lg text-[var(--p-text-2)]">{t.definition}</p>
        </section>

        {services.length > 0 ? (
          <section className="mx-auto max-w-6xl px-6">
            <div className="text-xs font-semibold tracking-[0.2em] text-[var(--p-text-2)] uppercase">
              {services.length} services anchor this experience mode
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
        ) : (
          <section className="mx-auto max-w-6xl px-6">
            <div className="surface p-6 text-sm text-[var(--p-text-2)]">
              <strong className="text-[var(--p-text-1)]">Cross-cutting mode.</strong> Physical experiences anchor the
              majority of services in the catalog — they&apos;re the default for in-person work. Browse the{" "}
              <Link href={paths.servicesRoot()} className="underline hover:text-[var(--p-accent)]">
                full services catalog
              </Link>{" "}
              for the comprehensive view.
            </div>
          </section>
        )}
      </div>
    </>
  );
}
