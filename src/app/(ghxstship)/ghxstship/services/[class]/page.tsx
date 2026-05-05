import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { CLASSES, CLASS_BY_SLUG, servicesByClass, servicesByClassOrCross, paths } from "@/lib/ghxstship";
import type { ClassSlug } from "@/lib/ghxstship/types";
import { GhxstshipJsonLd, breadcrumbSchema, serviceSchema } from "@/components/ghxstship/JsonLd";

export const dynamic = "force-static";

export function generateStaticParams() {
  return CLASSES.map((c) => ({ class: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ class: string }> }): Promise<Metadata> {
  const { class: classSlug } = await params;
  const c = CLASS_BY_SLUG[classSlug as ClassSlug];
  if (!c) return {};
  const items = servicesByClass(c.code);
  return {
    title: `${c.shortName} Services — ${items.length} Disciplines | GHXSTSHIP`,
    description: c.definition,
    alternates: { canonical: `https://ghxstship.pro/ghxstship/services/${c.slug}` },
  };
}

export default async function ClassDetail({ params }: { params: Promise<{ class: string }> }) {
  const { class: classSlug } = await params;
  const c = CLASS_BY_SLUG[classSlug as ClassSlug];
  if (!c) notFound();

  const primaryServices = servicesByClass(c.code);
  const crossServices = servicesByClassOrCross(c.code).filter((s) => s.primaryClass !== c.code);

  return (
    <>
      <GhxstshipJsonLd
        data={[
          breadcrumbSchema([
            { label: "GHXSTSHIP", href: "/ghxstship" },
            { label: "Services", href: "/ghxstship/services" },
            { label: c.shortName, href: paths.classDetail(c.slug) },
          ]),
          serviceSchema({
            name: `${c.shortName} Services`,
            description: c.definition,
            serviceType: c.shortName,
            identifier: c.code,
            offers: primaryServices.map((s) => ({
              name: s.name,
              identifier: `${c.code}-${String(s.number).padStart(3, "0")}`,
            })),
          }),
        ]}
      />

      <div className="space-y-16 pb-24">
        <section className="mx-auto max-w-6xl px-6 pt-12">
          <nav className="mb-6 text-xs text-[var(--text-muted)]">
            <Link href={paths.servicesRoot()} className="hover:text-[var(--text-primary)]">
              Services
            </Link>
            <span className="mx-2">/</span>
            <span className="text-[var(--text-primary)]">{c.shortName}</span>
          </nav>
          <div className="font-mono text-xs tracking-[0.18em] text-[var(--text-muted)]">Class {c.code}</div>
          <h1 className="mt-3 text-5xl uppercase sm:text-7xl" style={{ fontFamily: "var(--font-display)" }}>
            {c.shortName}
          </h1>
          <p className="mt-6 max-w-3xl text-lg text-[var(--text-secondary)]">{c.definition}</p>
        </section>

        <section className="mx-auto max-w-6xl px-6">
          <div className="text-xs font-semibold tracking-[0.2em] text-[var(--text-muted)] uppercase">
            Services in this discipline
          </div>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            {primaryServices.map((s) => (
              <Link
                key={s.number}
                href={paths.serviceDetail(c.slug, s.slug)}
                className="surface hover-lift group flex h-full flex-col gap-2 p-6"
              >
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-[10px] tracking-wider text-[var(--text-muted)]">
                    {String(s.number).padStart(3, "0")}
                  </span>
                  <span className="text-lg font-semibold">{s.name}</span>
                </div>
                <p className="line-clamp-2 text-sm text-[var(--text-secondary)]">{s.whatItIs}</p>
              </Link>
            ))}
          </div>
        </section>

        {crossServices.length > 0 && (
          <section className="mx-auto max-w-6xl px-6">
            <div className="text-xs font-semibold tracking-[0.2em] text-[var(--text-muted)] uppercase">
              Related services that touch {c.shortName}
            </div>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {crossServices.map((s) => {
                const primary = CLASSES.find((cls) => cls.code === s.primaryClass);
                if (!primary) return null;
                return (
                  <li key={s.number}>
                    <Link
                      href={paths.serviceDetail(primary.slug, s.slug)}
                      className="surface hover-lift flex h-full items-start gap-3 p-4"
                    >
                      <span className="font-mono text-[10px] tracking-wider text-[var(--text-muted)]">
                        {String(s.number).padStart(3, "0")}
                      </span>
                      <div>
                        <div className="text-sm">{s.name}</div>
                        <div className="text-[10px] text-[var(--text-muted)] uppercase">
                          Primary discipline: {primary.shortName}
                        </div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        <section className="mx-auto max-w-6xl px-6">
          <div className="surface-raised p-10">
            <h2 className="text-3xl uppercase sm:text-4xl" style={{ fontFamily: "var(--font-display)" }}>
              Brief us with what you have.
            </h2>
            <p className="mt-3 max-w-xl text-[var(--text-secondary)]">
              Email a paragraph. Walk us through a deck. Drop a venue address and a calendar window. We&apos;ll come
              back inside one business day with the scope, the producer, and the price band.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button href={paths.contact()} size="lg">
                Start a Project
              </Button>
              <Button href={paths.pricing()} size="lg" variant="secondary">
                See pricing
              </Button>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
