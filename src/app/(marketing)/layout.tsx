import { MarketingHeader } from "@/components/MarketingHeader";
import Link from "next/link";
import {
  InstagramLogo,
  TiktokLogo,
  YoutubeLogo,
  LinkedinLogo,
  SoundcloudLogo,
  ThreadsLogo,
  FacebookLogo,
} from "@phosphor-icons/react/dist/ssr";
import { Wordmark } from "@/components/brand/Wordmark";
import { WebVitalsReporter } from "@/components/marketing/WebVitalsReporter";
import { StickyCTABar } from "@/components/marketing/StickyCTABar";
import { getRequestT } from "@/lib/i18n/request";
import { BRAND } from "@/lib/brand";

/** Phosphor brand glyph per BRAND.socials key. */
const SOCIAL_ICONS: Record<string, typeof InstagramLogo> = {
  instagram: InstagramLogo,
  tiktok: TiktokLogo,
  youtube: YoutubeLogo,
  linkedin: LinkedinLogo,
  soundcloud: SoundcloudLogo,
  threads: ThreadsLogo,
  facebook: FacebookLogo,
};

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
  // Single-skin lock: the ATLVS marketing site uses the same neutral SaaS
  // skin as the console — visual consistency with the actual products
  // (Hanken Grotesk body, Anton display, soft elevation, neutral surfaces,
  // per-product accent). There is no separate cosmic marketing skin.
  return (
    <div data-ui="saas" data-theme="atlvs-product" data-product="atlvs" data-platform="atlvs" className="page-shell">
      <MarketingHeader />
      <WebVitalsReporter />
      <main id="main" tabIndex={-1}>
        {children}
      </main>
      <StickyCTABar />
      <footer className="mt-24 border-t border-[var(--p-border)] bg-[var(--p-surface-2)]">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid gap-10 md:grid-cols-3 lg:grid-cols-7">
            <div className="md:col-span-1">
              {/* Canonical ATLVS Technologies primary lockup — Waypoint mark
                  + Jost crossbar-less wordmark with TECHNOLOGIES subtitle, per
                  design_handoff_atlvs_kit/wordmarks.html. The mark + wordmark
                  bottom-align via baseline. */}
              <Link
                href="/"
                className="inline-flex items-end gap-2 whitespace-nowrap"
                aria-label={t("marketing.layout.footer.brand.homeAriaLabel")}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/brand/atlvs-mark.svg" alt="" width={22} height={22} aria-hidden="true" />
                <Wordmark word="ATLVS" subtitle="TECHNOLOGIES" style={{ fontSize: 16, fontWeight: 500 }} />
              </Link>
              <p className="mt-3 text-xs text-[var(--p-text-2)]">{t("marketing.layout.footer.brand.tagline")}</p>
              {/* Company social presence — the parent GHXSTSHIP profiles
                  (SSOT: src/lib/brand.ts `socials`, mirrored from
                  linktr.ee/ghxstship). ATLVS Technologies has no separate
                  accounts. */}
              <div className="mt-4 flex flex-wrap gap-3 text-[var(--p-text-2)]">
                {BRAND.socials.map((s) => {
                  const Glyph = SOCIAL_ICONS[s.key];
                  return (
                    <a
                      key={s.key}
                      href={s.href}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={s.label}
                      title={s.label}
                      className="text-[var(--p-text-2)] hover:text-[var(--p-text-1)]"
                    >
                      {Glyph ? <Glyph size={18} weight="regular" aria-hidden="true" /> : s.label}
                    </a>
                  );
                })}
              </div>
            </div>
            {FOOTER_NAV.map((col) => (
              <div key={col.headingKey}>
                <div className="eyebrow">{t(col.headingKey)}</div>
                <ul className="mt-4 space-y-2 text-sm">
                  {col.items.map((item) => (
                    <li key={item.href}>
                      <Link href={item.href} className="text-[var(--p-text-2)] hover:text-[var(--p-text-1)]">
                        {t(item.labelKey)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-12 border-t border-[var(--p-border)] pt-6 text-xs text-[var(--p-text-2)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span>{t("marketing.layout.footer.copyright", { year: new Date().getFullYear() })}</span>
              <span>{t("marketing.layout.footer.tagline")}</span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] leading-relaxed">
              {t("marketing.layout.footer.trademarkPrefix")}{" "}
              {/* GHXSTSHIP parent endorsement lockup — small ink-tile skull
                  paired with the Jost crossbar-less wordmark. The skull is
                  the parent-company mark, NEVER the ATLVS product icon. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/logo-ghostship-skull.svg"
                alt=""
                width={14}
                height={14}
                aria-hidden="true"
                className="inline-block align-middle"
              />
              <Wordmark word="GHXSTSHIP" className="text-[var(--p-text-2)]" style={{ fontSize: 12, fontWeight: 500 }} />{" "}
              {t("marketing.layout.footer.trademarkSuffix")}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
