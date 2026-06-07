import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { SOLUTIONS, SOLUTION_BY_SLUG, CLASS_BY_CODE, resolveServices, paths } from "@/lib/ghxstship";
import type { SolutionSlug } from "@/lib/ghxstship/types";
import { GhxstshipJsonLd, breadcrumbSchema, serviceSchema } from "@/components/ghxstship/JsonLd";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-static";

export function generateStaticParams() {
  return SOLUTIONS.map((s) => ({ solution: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ solution: string }> }): Promise<Metadata> {
  const { solution } = await params;
  const s = SOLUTION_BY_SLUG[solution as SolutionSlug];
  if (!s) return {};
  const { t } = await getRequestT();
  return {
    title: t("ghxstship.solution.meta.title", { name: s.name }, "{name} — Production Company | GHXSTSHIP"),
    description: s.definition,
    alternates: { canonical: `https://ghxstship.pro/ghxstship/solutions/${s.slug}` },
  };
}

export default async function SolutionDetail({ params }: { params: Promise<{ solution: string }> }) {
  const { solution } = await params;
  const s = SOLUTION_BY_SLUG[solution as SolutionSlug];
  if (!s) notFound();
  const { t } = await getRequestT();

  const services = resolveServices(s.anchoredServices);
  const byClass = new Map<string, typeof services>();
  for (const svc of services) {
    const code = svc.primaryClass;
    if (!byClass.has(code)) byClass.set(code, []);
    byClass.get(code)!.push(svc);
  }
  const groupEntries = Array.from(byClass.entries()).sort((a, b) => a[0].localeCompare(b[0]));

  return (
    <>
      <GhxstshipJsonLd
        data={[
          breadcrumbSchema([
            { label: "GHXSTSHIP", href: "/ghxstship" },
            { label: "Industries", href: "/ghxstship/solutions" },
            { label: s.name, href: paths.solutionDetail(s.slug) },
          ]),
          serviceSchema({
            name: `${s.name} Production`,
            description: s.definition,
            serviceType: s.name,
            category: "Experiential Production",
            offers: services.map((svc) => ({
              name: svc.name,
              identifier: `${svc.primaryClass}-${String(svc.number).padStart(3, "0")}`,
            })),
          }),
        ]}
      />

      <div className="space-y-16 pb-24">
        <section className="mx-auto max-w-6xl px-6 pt-12">
          <nav className="mb-6 text-xs text-[var(--p-text-2)]">
            <Link href={paths.solutionsRoot()} className="hover:text-[var(--p-text-1)]">
              {t("ghxstship.solution.crumb", undefined, "Industries")}
            </Link>
            <span className="mx-2">/</span>
            <span className="text-[var(--p-text-1)]">{s.name}</span>
          </nav>
          <h1 className="text-4xl uppercase sm:text-6xl" style={{ fontFamily: "var(--font-display)" }}>
            {s.name}
          </h1>
          <p className="mt-6 max-w-3xl text-lg text-[var(--p-text-2)]">{s.definition}</p>
        </section>

        <section className="mx-auto max-w-6xl px-6">
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            <FactCell
              label={t("ghxstship.solution.facts.whenWorkHappens", undefined, "When the work happens")}
              body={s.phaseEmphasis}
            />
            <FactCell
              label={t("ghxstship.solution.facts.depthOfDetail", undefined, "Depth of detail")}
              body={s.apsEmphasis}
            />
            <FactCell
              label={t("ghxstship.solution.facts.experienceModes", undefined, "Experience modes")}
              body={s.tierEmphasis}
            />
            <FactCell
              label={t("ghxstship.solution.facts.whereItLands", undefined, "Where it tends to land")}
              body={s.geoStrongholds}
            />
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6">
          <div className="text-xs font-semibold tracking-[0.2em] text-[var(--p-text-2)] uppercase">
            {t(
              "ghxstship.solution.servicesAnchor",
              { count: services.length, disciplines: groupEntries.length },
              "{count} services anchor this industry across {disciplines} disciplines",
            )}
          </div>
          <div className="mt-6 space-y-8">
            {groupEntries.map(([code, list]) => {
              const c = CLASS_BY_CODE[code as keyof typeof CLASS_BY_CODE];
              if (!c) return null;
              return (
                <div key={code} className="surface overflow-hidden">
                  <div className="flex items-baseline justify-between gap-4 bg-[var(--p-surface)] p-4">
                    <span className="text-lg uppercase" style={{ fontFamily: "var(--font-display)" }}>
                      {c.shortName}
                    </span>
                    <Link
                      href={paths.classDetail(c.slug)}
                      className="text-xs font-semibold tracking-wide uppercase hover:text-[var(--p-accent)]"
                    >
                      {t(
                        "ghxstship.solution.allClassServices",
                        { name: c.shortName.toLowerCase() },
                        "All {name} services →",
                      )}
                    </Link>
                  </div>
                  <ul className="grid gap-px bg-[var(--p-border)] sm:grid-cols-2 lg:grid-cols-3">
                    {list.map((svc) => (
                      <li key={svc.number}>
                        <Link
                          href={paths.serviceDetail(c.slug, svc.slug)}
                          className="nav-item flex h-full items-start gap-3 bg-[var(--p-bg)] p-3"
                        >
                          <span className="font-mono text-[10px] tracking-wider text-[var(--p-text-2)]">
                            {String(svc.number).padStart(3, "0")}
                          </span>
                          <span className="text-sm">{svc.name}</span>
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
            <h2 className="text-3xl uppercase sm:text-4xl" style={{ fontFamily: "var(--font-display)" }}>
              {t("ghxstship.solution.cta.heading", { name: s.name.toLowerCase() }, "Run a {name} engagement.")}
            </h2>
            <p className="mt-3 max-w-xl text-[var(--p-text-2)]">
              {t(
                "ghxstship.solution.cta.body",
                { count: services.length },
                "We’ll resolve your brief against the {count} services anchored here and reply with the recommended engagement model and producer assignment.",
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

function FactCell({ label, body }: { label: string; body: string }) {
  return (
    <div className="surface p-5">
      <div className="text-[11px] font-semibold tracking-[0.2em] uppercase" style={{ color: "var(--p-accent)" }}>
        {label}
      </div>
      <p className="mt-2 text-sm text-[var(--p-text-2)]">{body}</p>
    </div>
  );
}
