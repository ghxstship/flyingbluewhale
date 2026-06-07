import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { CLASSES, CLASS_BY_SLUG, servicesByClass, servicesByClassOrCross, paths } from "@/lib/ghxstship";
import type { ClassSlug } from "@/lib/ghxstship/types";
import { GhxstshipJsonLd, breadcrumbSchema, serviceSchema } from "@/components/ghxstship/JsonLd";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-static";

export function generateStaticParams() {
  return CLASSES.map((c) => ({ class: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ class: string }> }): Promise<Metadata> {
  const { class: classSlug } = await params;
  const c = CLASS_BY_SLUG[classSlug as ClassSlug];
  if (!c) return {};
  const items = servicesByClass(c.code);
  const { t } = await getRequestT();
  return {
    title: t(
      "ghxstship.serviceClass.meta.title",
      { name: c.shortName, count: items.length },
      "{name} Services — {count} Disciplines | GHXSTSHIP",
    ),
    description: c.definition,
    alternates: { canonical: `https://ghxstship.pro/ghxstship/services/${c.slug}` },
  };
}

export default async function ClassDetail({ params }: { params: Promise<{ class: string }> }) {
  const { class: classSlug } = await params;
  const c = CLASS_BY_SLUG[classSlug as ClassSlug];
  if (!c) notFound();
  const { t } = await getRequestT();

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
          <nav className="mb-6 text-xs text-[var(--p-text-2)]">
            <Link href={paths.servicesRoot()} className="hover:text-[var(--p-text-1)]">
              {t("ghxstship.serviceClass.crumb", undefined, "Services")}
            </Link>
            <span className="mx-2">/</span>
            <span className="text-[var(--p-text-1)]">{c.shortName}</span>
          </nav>
          <div className="font-mono text-xs tracking-[0.18em] text-[var(--p-text-2)]">
            {t("ghxstship.serviceClass.classLabel", { code: c.code }, "Class {code}")}
          </div>
          <h1 className="mt-3 text-5xl uppercase sm:text-7xl" style={{ fontFamily: "var(--font-display)" }}>
            {c.shortName}
          </h1>
          <p className="mt-6 max-w-3xl text-lg text-[var(--p-text-2)]">{c.definition}</p>
        </section>

        <section className="mx-auto max-w-6xl px-6">
          <div className="text-xs font-semibold tracking-[0.2em] text-[var(--p-text-2)] uppercase">
            {t("ghxstship.serviceClass.servicesInDiscipline", undefined, "Services in this discipline")}
          </div>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            {primaryServices.map((s) => (
              <Link
                key={s.number}
                href={paths.serviceDetail(c.slug, s.slug)}
                className="surface hover-lift group flex h-full flex-col gap-2 p-6"
              >
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-[10px] tracking-wider text-[var(--p-text-2)]">
                    {String(s.number).padStart(3, "0")}
                  </span>
                  <span className="text-lg font-semibold">{s.name}</span>
                </div>
                <p className="line-clamp-2 text-sm text-[var(--p-text-2)]">{s.whatItIs}</p>
              </Link>
            ))}
          </div>
        </section>

        {crossServices.length > 0 && (
          <section className="mx-auto max-w-6xl px-6">
            <div className="text-xs font-semibold tracking-[0.2em] text-[var(--p-text-2)] uppercase">
              {t("ghxstship.serviceClass.relatedServices", { name: c.shortName }, "Related services that touch {name}")}
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
                      <span className="font-mono text-[10px] tracking-wider text-[var(--p-text-2)]">
                        {String(s.number).padStart(3, "0")}
                      </span>
                      <div>
                        <div className="text-sm">{s.name}</div>
                        <div className="text-[10px] text-[var(--p-text-2)] uppercase">
                          {t(
                            "ghxstship.serviceClass.primaryDiscipline",
                            { name: primary.shortName },
                            "Primary discipline: {name}",
                          )}
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
              {t("ghxstship.serviceClass.cta.heading", undefined, "Brief us with what you have.")}
            </h2>
            <p className="mt-3 max-w-xl text-[var(--p-text-2)]">
              {t(
                "ghxstship.serviceClass.cta.body",
                undefined,
                "Email a paragraph. Walk us through a deck. Drop a venue address and a calendar window. We’ll come back inside one business day with the scope, the producer, and the price band.",
              )}
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button href={paths.contact()} size="lg">
                {t("ghxstship.common.startProject", undefined, "Start a Project")}
              </Button>
              <Button href={paths.pricing()} size="lg" variant="secondary">
                {t("ghxstship.common.seePricing", undefined, "See pricing")}
              </Button>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
