import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/Button";
import {
  CLASS_BY_CODE,
  CLASS_BY_SLUG,
  PHASE_BY_NUMBER,
  TIER_BY_NUMBER,
  SERVICE_BY_SLUG,
  SERVICES,
  servicesByClass,
  SOLUTIONS,
  paths,
} from "@/lib/ghxstship";
import type { ClassSlug, PhaseNumber } from "@/lib/ghxstship/types";
import { GhxstshipJsonLd, breadcrumbSchema, serviceSchema } from "@/components/ghxstship/JsonLd";
import { getRequestT } from "@/lib/i18n/request";

type Translate = Awaited<ReturnType<typeof getRequestT>>["t"];

export const dynamic = "force-static";

export function generateStaticParams() {
  return SERVICES.map((s) => ({
    class: CLASS_BY_CODE[s.primaryClass].slug,
    service: s.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ class: string; service: string }>;
}): Promise<Metadata> {
  const { class: classSlug, service } = await params;
  const s = SERVICE_BY_SLUG[service];
  if (!s) return {};
  const { t } = await getRequestT();
  return {
    title: t("ghxstship.service.meta.title", { name: s.name }, "{name} | GHXSTSHIP"),
    description: s.whatItIs,
    alternates: { canonical: `https://ghxstship.pro/ghxstship/services/${classSlug}/${service}` },
  };
}

export default async function ServiceDetail({ params }: { params: Promise<{ class: string; service: string }> }) {
  const { class: classSlug, service: serviceSlug } = await params;
  const c = CLASS_BY_SLUG[classSlug as ClassSlug];
  const s = SERVICE_BY_SLUG[serviceSlug];
  if (!c || !s || s.primaryClass !== c.code) notFound();
  const { t } = await getRequestT();

  const primaryPhase = PHASE_BY_NUMBER[s.primaryPhase];
  const tierObjects = s.tiers.map((t) => TIER_BY_NUMBER[t]).filter(Boolean);
  const crossClasses = (s.crossClass ?? []).map((code) => CLASS_BY_CODE[code]).filter(Boolean);

  const siblings = servicesByClass(c.code)
    .filter((x) => x.number !== s.number)
    .sort((a, b) => Math.abs(a.number - s.number) - Math.abs(b.number - s.number))
    .slice(0, 4);

  const anchoredIn = SOLUTIONS.filter((sol) => sol.anchoredServices.includes(s.number)).slice(0, 4);

  return (
    <>
      <GhxstshipJsonLd
        data={[
          breadcrumbSchema([
            { label: "GHXSTSHIP", href: "/ghxstship" },
            { label: "Services", href: "/ghxstship/services" },
            { label: c.shortName, href: paths.classDetail(c.slug) },
            { label: s.name, href: paths.serviceDetail(c.slug, s.slug) },
          ]),
          serviceSchema({
            name: s.name,
            description: s.whatItIs,
            serviceType: c.shortName,
            identifier: `${c.code}-${String(s.number).padStart(3, "0")}`,
            category: "Experiential Production",
          }),
        ]}
      />

      <div className="space-y-16 pb-24">
        <section className="mx-auto max-w-6xl px-6 pt-12">
          <nav className="mb-6 text-xs text-[var(--p-text-2)]">
            <Link href={paths.servicesRoot()} className="hover:text-[var(--p-text-1)]">
              {t("ghxstship.service.crumb", undefined, "Services")}
            </Link>
            <span className="mx-2">/</span>
            <Link href={paths.classDetail(c.slug)} className="hover:text-[var(--p-text-1)]">
              {c.shortName}
            </Link>
            <span className="mx-2">/</span>
            <span className="text-[var(--p-text-1)]">{String(s.number).padStart(3, "0")}</span>
          </nav>
          <div className="font-mono text-[10px] tracking-[0.2em] text-[var(--p-text-2)]">
            {t(
              "ghxstship.service.label",
              { number: String(s.number).padStart(3, "0"), name: c.shortName },
              "Service {number} · {name}",
            )}
            {crossClasses.length > 0 && ` × ${crossClasses.map((cc) => cc.shortName).join(" × ")}`}
          </div>
          <h1 className="mt-3 text-4xl uppercase sm:text-6xl" style={{ fontFamily: "var(--font-display)" }}>
            {s.name}
          </h1>
        </section>

        <section className="mx-auto max-w-6xl px-6">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="surface p-6">
              <div className="text-xs font-semibold tracking-[0.18em] uppercase" style={{ color: "var(--p-accent)" }}>
                {t("ghxstship.service.whatItIs", undefined, "What it is")}
              </div>
              <p className="mt-3 text-[var(--p-text-2)]">{s.whatItIs}</p>
            </div>
            <div className="surface p-6">
              <div className="text-xs font-semibold tracking-[0.18em] uppercase" style={{ color: "var(--p-accent)" }}>
                {t("ghxstship.service.whenYouNeed", undefined, "When you need it")}
              </div>
              <p className="mt-3 text-[var(--p-text-2)]">{s.whenYouNeed}</p>
            </div>
            <div className="surface p-6">
              <div className="text-xs font-semibold tracking-[0.18em] uppercase" style={{ color: "var(--p-accent)" }}>
                {t("ghxstship.service.whatYouReceive", undefined, "What you receive")}
              </div>
              <p className="mt-3 text-[var(--p-text-2)]">{s.whatYouReceive}</p>
            </div>
            <div className="surface p-6">
              <div className="text-xs font-semibold tracking-[0.18em] uppercase" style={{ color: "var(--p-accent)" }}>
                {t("ghxstship.service.whereItOperates", undefined, "Where it operates")}
              </div>
              <p className="mt-3 text-[var(--p-text-2)]">{s.whereItOperates}</p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6">
          <div className="grid gap-5 md:grid-cols-3">
            <FactCard label={t("ghxstship.service.primaryPhase", undefined, "Primary phase")}>
              <Link href={paths.phaseDetail(primaryPhase.slug)} className="hover:text-[var(--p-accent)]">
                {primaryPhase.name}
              </Link>
              <p className="mt-2 text-xs text-[var(--p-text-2)]">{primaryPhase.buyerIntent}</p>
              {Array.isArray(s.secondaryPhases) && s.secondaryPhases.length > 0 && (
                <div className="mt-3 text-[10px] tracking-wide text-[var(--p-text-2)] uppercase">
                  {t("ghxstship.service.alsoActiveIn", undefined, "Also active in:")}{" "}
                  {s.secondaryPhases
                    .map((p) => PHASE_BY_NUMBER[p as PhaseNumber]?.name)
                    .filter(Boolean)
                    .join(", ")}
                </div>
              )}
              {s.secondaryPhases === "all" && (
                <div className="mt-3 text-[10px] tracking-wide text-[var(--p-text-2)] uppercase">
                  {t("ghxstship.service.activeFullLifecycle", undefined, "Active across the full project lifecycle")}
                </div>
              )}
            </FactCard>
            <FactCard label={t("ghxstship.service.detailDepth", undefined, "Detail depth")}>
              <ul className="space-y-1 text-sm">
                {s.apsLevels.map((lvl) => (
                  <li key={lvl}>{depthLabel(lvl, t)}</li>
                ))}
              </ul>
            </FactCard>
            <FactCard label={t("ghxstship.service.experienceModes", undefined, "Experience modes")}>
              <ul className="space-y-1 text-sm">
                {tierObjects.map((t) => (
                  <li key={t.number}>
                    <Link href={paths.tierDetail(t.slug)} className="hover:text-[var(--p-accent)]">
                      {t.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </FactCard>
          </div>
        </section>

        {anchoredIn.length > 0 && (
          <section className="mx-auto max-w-6xl px-6">
            <div className="text-xs font-semibold tracking-[0.2em] text-[var(--p-text-2)] uppercase">
              {t("ghxstship.service.industriesAnchor", undefined, "Industries where this service anchors")}
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {anchoredIn.map((sol) => (
                <Link
                  key={sol.slug}
                  href={paths.solutionDetail(sol.slug)}
                  className="surface hover-lift block p-4 text-sm"
                >
                  {sol.name}
                </Link>
              ))}
            </div>
          </section>
        )}

        {siblings.length > 0 && (
          <section className="mx-auto max-w-6xl px-6">
            <div className="text-xs font-semibold tracking-[0.2em] text-[var(--p-text-2)] uppercase">
              {t("ghxstship.service.relatedServices", { name: c.shortName }, "Related services in {name}")}
            </div>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {siblings.map((sib) => (
                <li key={sib.number}>
                  <Link href={paths.serviceDetail(c.slug, sib.slug)} className="surface hover-lift block p-4">
                    <div className="flex items-baseline gap-3">
                      <span className="font-mono text-[10px] tracking-wider text-[var(--p-text-2)]">
                        {String(sib.number).padStart(3, "0")}
                      </span>
                      <span className="text-sm font-semibold">{sib.name}</span>
                    </div>
                    <p className="mt-2 line-clamp-2 text-xs text-[var(--p-text-2)]">{sib.whatItIs}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mx-auto max-w-6xl px-6">
          <div className="surface-raised p-10">
            <h2 className="text-3xl uppercase sm:text-4xl" style={{ fontFamily: "var(--font-display)" }}>
              {t("ghxstship.service.cta.heading", undefined, "Add this to your engagement.")}
            </h2>
            <p className="mt-3 max-w-xl text-[var(--p-text-2)]">
              {t(
                "ghxstship.service.cta.body",
                undefined,
                "Most engagements bundle eight to forty services from the catalog. Tell us the brief; we’ll come back with the scope, the engagement model, and the producer.",
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

function FactCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="surface p-5">
      <div className="text-[11px] font-semibold tracking-[0.2em] text-[var(--p-text-2)] uppercase">{label}</div>
      <div className="mt-3 text-sm">{children}</div>
    </div>
  );
}

function depthLabel(level: string, t: Translate): string {
  const map: Record<string, string> = {
    L1: t("ghxstship.service.depth.L1", undefined, "Project — multi-event container"),
    L2: t("ghxstship.service.depth.L2", undefined, "Event — single occasion"),
    L3: t("ghxstship.service.depth.L3", undefined, "Zone — area within an event"),
    L4: t("ghxstship.service.depth.L4", undefined, "Activation — experience unit"),
    L5: t("ghxstship.service.depth.L5", undefined, "Component — build element"),
    L6: t("ghxstship.service.depth.L6", undefined, "Item — atomic unit"),
  };
  return map[level] ?? level;
}
