import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CLASSES, SERVICES, servicesByClass, paths, CATALOG_STATS } from "@/lib/ghxstship";
import { GhxstshipJsonLd, breadcrumbSchema, serviceSchema } from "@/components/ghxstship/JsonLd";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Services Catalog — Production, Build, Hospitality, Technology | GHXSTSHIP",
  description:
    "The full GHXSTSHIP services catalog — 114 production services across 10 disciplines: Executive, Creative, Talent, Marketing, Build, Production, Operations, Experience, Hospitality, Technology.",
  keywords: [
    "production services catalog",
    "event production services",
    "festival production services",
    "scenic fabrication services",
    "live event technical services",
    "production hospitality services",
  ],
  alternates: { canonical: "https://ghxstship.pro/ghxstship/services" },
};

export default function ServicesHub() {
  return (
    <>
      <GhxstshipJsonLd
        data={[
          breadcrumbSchema([
            { label: "GHXSTSHIP", href: "/ghxstship" },
            { label: "Services", href: "/ghxstship/services" },
          ]),
          serviceSchema({
            name: "GHXSTSHIP Services Catalog",
            description:
              "Full production services catalog covering every discipline from creative direction through wrap reporting.",
            serviceType: "Experiential Production Services",
            offers: SERVICES.slice(0, 60).map((s) => ({
              name: s.name,
              identifier: `${s.primaryClass}-${String(s.number).padStart(3, "0")}`,
            })),
          }),
        ]}
      />

      <div className="space-y-20 pb-24">
        <section className="mx-auto max-w-6xl px-6 pt-16">
          <div className="text-xs font-semibold tracking-[0.25em] uppercase" style={{ color: "var(--org-primary)" }}>
            Services Catalog
          </div>
          <h1 className="mt-4 text-5xl uppercase sm:text-7xl" style={{ fontFamily: "var(--font-display)" }}>
            {CATALOG_STATS.serviceCount} services.
            <br />
            {CATALOG_STATS.classCount} disciplines.
            <br />
            Real producers behind every line.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-[var(--text-secondary)]">
            Each service is a real, scoped, priceable line of work — not a marketing buzzword. Browse by discipline
            below, or jump straight to the industry vertical you&apos;re in. Every service detail page tells you what it
            is, when in the project you need it, what you receive, and where it operates.
          </p>
        </section>

        <section className="mx-auto max-w-6xl px-6">
          <div className="space-y-8">
            {CLASSES.map((c) => {
              const items = servicesByClass(c.code);
              return (
                <div key={c.code} className="surface overflow-hidden">
                  <div className="flex flex-wrap items-end justify-between gap-4 bg-[var(--bg-secondary)] p-6">
                    <div>
                      <div className="font-mono text-[10px] tracking-[0.18em] text-[var(--text-muted)]">
                        Class {c.code}
                      </div>
                      <h2 className="mt-1 text-3xl uppercase sm:text-4xl" style={{ fontFamily: "var(--font-display)" }}>
                        {c.shortName}
                      </h2>
                      <p className="mt-2 max-w-2xl text-sm text-[var(--text-secondary)]">{c.definition}</p>
                    </div>
                    <Link href={paths.classDetail(c.slug)} className="btn btn-secondary btn-sm">
                      {items.length} services <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                  <ul className="grid gap-px bg-[var(--border-color)] sm:grid-cols-2 lg:grid-cols-3">
                    {items.map((s) => (
                      <li key={s.number}>
                        <Link
                          href={paths.serviceDetail(c.slug, s.slug)}
                          className="nav-item flex h-full items-start gap-3 bg-[var(--background)] p-4"
                        >
                          <span className="font-mono text-[10px] tracking-wider text-[var(--text-muted)]">
                            {String(s.number).padStart(3, "0")}
                          </span>
                          <span className="text-sm text-[var(--text-primary)]">{s.name}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6">
          <div className="surface-raised p-10">
            <div className="grid gap-8 md:grid-cols-2 md:items-end">
              <div>
                <h2 className="text-3xl uppercase sm:text-4xl" style={{ fontFamily: "var(--font-display)" }}>
                  Don&apos;t know what to call it?
                </h2>
                <p className="mt-3 max-w-xl text-[var(--text-secondary)]">
                  Brief us in plain English. We&apos;ll resolve it against the catalog, reply with a scope, a
                  recommended engagement model, and the producer who&apos;ll own it.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button href={paths.contact()} size="lg">
                  Start a Project
                </Button>
                <Button href={paths.solutionsRoot()} size="lg" variant="secondary">
                  Browse by industry
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
