import { MarketingHeader } from "@/components/MarketingHeader";
import Link from "next/link";
import { WebVitalsReporter } from "@/components/marketing/WebVitalsReporter";
import { StickyCTABar } from "@/components/marketing/StickyCTABar";
import { getRequestT } from "@/lib/i18n/request";

const FOOTER_NAV: Array<{ headingKey: string; items: Array<{ labelKey: string; href: string }> }> = [
  {
    headingKey: "marketing.layout.footer.product.heading",
    items: [
      { labelKey: "marketing.layout.footer.product.solutions", href: "/solutions" },
      { labelKey: "marketing.layout.footer.product.atlvs", href: "/solutions/atlvs" },
      { labelKey: "marketing.layout.footer.product.gvteway", href: "/solutions/gvteway" },
      { labelKey: "marketing.layout.footer.product.compvss", href: "/solutions/compvss" },
      { labelKey: "marketing.layout.footer.product.features", href: "/features" },
      { labelKey: "marketing.layout.footer.product.ai", href: "/ai" },
      { labelKey: "marketing.layout.footer.product.integrations", href: "/integrations" },
      { labelKey: "marketing.layout.footer.product.pricing", href: "/pricing" },
      { labelKey: "marketing.layout.footer.product.changelog", href: "/changelog" },
      { labelKey: "marketing.layout.footer.product.roadmap", href: "/roadmap" },
    ],
  },
  {
    headingKey: "marketing.layout.footer.builtFor.heading",
    items: [
      { labelKey: "marketing.layout.footer.builtFor.tourManagers", href: "/teams/tour-managers" },
      { labelKey: "marketing.layout.footer.builtFor.productionManagers", href: "/teams/production-managers" },
      { labelKey: "marketing.layout.footer.builtFor.stageManagers", href: "/teams/stage-managers" },
      { labelKey: "marketing.layout.footer.builtFor.festivalDirectors", href: "/teams/festival-directors" },
      { labelKey: "marketing.layout.footer.builtFor.siteManagers", href: "/teams/site-managers" },
      { labelKey: "marketing.layout.footer.builtFor.techDirectors", href: "/teams/technical-directors" },
      { labelKey: "marketing.layout.footer.builtFor.talentBuyers", href: "/teams/talent-buyers" },
      { labelKey: "marketing.layout.footer.builtFor.ehsLeads", href: "/teams/hse-leads" },
    ],
  },
  {
    headingKey: "marketing.layout.footer.industries.heading",
    items: [
      { labelKey: "marketing.layout.footer.industries.liveEvents", href: "/solutions/live-events" },
      { labelKey: "marketing.layout.footer.industries.concerts", href: "/solutions/concerts" },
      { labelKey: "marketing.layout.footer.industries.festivalsTours", href: "/solutions/festivals-tours" },
      { labelKey: "marketing.layout.footer.industries.immersive", href: "/solutions/immersive-experiences" },
      { labelKey: "marketing.layout.footer.industries.brandActivations", href: "/solutions/brand-activations" },
      { labelKey: "marketing.layout.footer.industries.corporate", href: "/solutions/corporate-events" },
      { labelKey: "marketing.layout.footer.industries.theatrical", href: "/solutions/theatrical-performances" },
      { labelKey: "marketing.layout.footer.industries.broadcast", href: "/solutions/broadcast-tv-film" },
    ],
  },
  {
    headingKey: "marketing.layout.footer.resources.heading",
    items: [
      { labelKey: "marketing.layout.footer.resources.docs", href: "/docs" },
      { labelKey: "marketing.layout.footer.resources.guides", href: "/guides" },
      { labelKey: "marketing.layout.footer.resources.glossary", href: "/glossary" },
      { labelKey: "marketing.layout.footer.resources.templates", href: "/templates" },
      { labelKey: "marketing.layout.footer.resources.tools", href: "/tools" },
      { labelKey: "marketing.layout.footer.resources.blog", href: "/blog" },
      { labelKey: "marketing.layout.footer.resources.community", href: "/community" },
      { labelKey: "marketing.layout.footer.resources.help", href: "/help" },
    ],
  },
  {
    headingKey: "marketing.layout.footer.compare.heading",
    items: [
      { labelKey: "marketing.layout.footer.compare.cvent", href: "/compare/cvent" },
      { labelKey: "marketing.layout.footer.compare.procore", href: "/compare/procore" },
      { labelKey: "marketing.layout.footer.compare.eventbrite", href: "/compare/eventbrite" },
      { labelKey: "marketing.layout.footer.compare.masterTour", href: "/compare/master-tour" },
      { labelKey: "marketing.layout.footer.compare.monday", href: "/compare/monday" },
      { labelKey: "marketing.layout.footer.compare.notion", href: "/compare/notion" },
      { labelKey: "marketing.layout.footer.compare.airtable", href: "/compare/airtable" },
      { labelKey: "marketing.layout.footer.compare.asana", href: "/compare/asana" },
      { labelKey: "marketing.layout.footer.compare.docusign", href: "/compare/docusign" },
      { labelKey: "marketing.layout.footer.compare.salesforce", href: "/compare/salesforce" },
      { labelKey: "marketing.layout.footer.compare.allAlternatives", href: "/alternatives" },
    ],
  },
  {
    headingKey: "marketing.layout.footer.studio.heading",
    items: [
      { labelKey: "marketing.layout.footer.studio.about", href: "/about" },
      { labelKey: "marketing.layout.footer.studio.contact", href: "/contact" },
      { labelKey: "marketing.layout.footer.studio.careers", href: "/careers" },
      { labelKey: "marketing.layout.footer.studio.customers", href: "/customers" },
      { labelKey: "marketing.layout.footer.studio.press", href: "/press" },
      { labelKey: "marketing.layout.footer.studio.partners", href: "/partners" },
      { labelKey: "marketing.layout.footer.studio.status", href: "/status" },
    ],
  },
  {
    headingKey: "marketing.layout.footer.legal.heading",
    items: [
      { labelKey: "marketing.layout.footer.legal.terms", href: "/legal/terms" },
      { labelKey: "marketing.layout.footer.legal.privacy", href: "/legal/privacy" },
      { labelKey: "marketing.layout.footer.legal.dpa", href: "/legal/dpa" },
      { labelKey: "marketing.layout.footer.legal.sla", href: "/legal/sla" },
    ],
  },
];

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const { t } = await getRequestT();
  // Two-skin lock: the ATLVS marketing site uses the same neutral SaaS
  // skin as the console — visual consistency with the actual products
  // (Inter, soft elevation, neutral surfaces, per-product accent). The
  // cosmic GHXSTSHIP brand voice lives only at /ghxstship (the parent
  // company surface, locked in (ghxstship)/ghxstship/layout.tsx).
  return (
    <div data-theme="atlvs-product" data-platform="atlvs" className="page-shell">
      <MarketingHeader />
      <WebVitalsReporter />
      <main>{children}</main>
      <StickyCTABar />
      <footer className="mt-24 border-t border-[var(--border-color)] bg-[var(--surface-inset)]">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid gap-10 md:grid-cols-3 lg:grid-cols-7">
            <div className="md:col-span-1">
              {/* Canonical ATLVS primary lockup — Waypoint mark + spaced
                  wordmark per ui_kits/atlvs/logo-kit.html "Primary Lockup". */}
              <Link
                href="/"
                className="inline-flex items-center gap-2 whitespace-nowrap"
                aria-label={t("marketing.layout.footer.brand.homeAriaLabel")}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/brand/atlvs-mark.svg" alt="" width={20} height={20} aria-hidden="true" />
                <span className="text-base font-semibold tracking-[0.18em] uppercase">A T L V S</span>
              </Link>
              <p className="mt-3 text-xs text-[var(--text-muted)]">{t("marketing.layout.footer.brand.tagline")}</p>
              <div className="mt-4 flex gap-3 text-xs text-[var(--text-muted)]">
                <a
                  href="https://twitter.com/atlvs.pro"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[var(--text-primary)]"
                >
                  {t("marketing.layout.footer.social.twitter")}
                </a>
                <a
                  href="https://github.com/ghxstship"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[var(--text-primary)]"
                >
                  {t("marketing.layout.footer.social.github")}
                </a>
              </div>
            </div>
            {FOOTER_NAV.map((col) => (
              <div key={col.headingKey}>
                <div className="eyebrow">{t(col.headingKey)}</div>
                <ul className="mt-4 space-y-2 text-sm">
                  {col.items.map((item) => (
                    <li key={item.href}>
                      <Link href={item.href} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                        {t(item.labelKey)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-12 border-t border-[var(--border-color)] pt-6 text-xs text-[var(--text-muted)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span>{t("marketing.layout.footer.copyright", { year: new Date().getFullYear() })}</span>
              <span>{t("marketing.layout.footer.tagline")}</span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] leading-relaxed">
              {t("marketing.layout.footer.trademarkPrefix")}{" "}
              {/* GHXSTSHIP parent endorsement lockup — small ink-tile skull
                  paired with the spaced wordmark per v4 logo-kit
                  "Endorsement" section. The skull is the parent-company
                  mark, NEVER the ATLVS product icon. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/logo-ghostship-skull.svg"
                alt=""
                width={14}
                height={14}
                aria-hidden="true"
                className="inline-block align-middle"
              />
              <span className="font-medium tracking-[0.18em] text-[var(--text-secondary)]">G H X S T S H I P</span>{" "}
              {t("marketing.layout.footer.trademarkSuffix")}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
