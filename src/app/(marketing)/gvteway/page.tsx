import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/marketing/JsonLd";
import { CTASection } from "@/components/marketing/CTASection";
import { FAQSection } from "@/components/marketing/FAQ";
import { MarketingHero, MarketingSection, MarketingGrid, MarketingPageShell } from "@/components/marketing/MarketingPrimitives";
import { buildMetadata, breadcrumbSchema, faqSchema, SITE } from "@/lib/seo";
import { getStaticEnT } from "../_lib/static-t";
import { WaitlistForm } from "../_lib/WaitlistForm";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getStaticEnT();
  return buildMetadata({
    title: t("marketing.pages.gvtewayTeaser.metadata.title", undefined, "GVTEWAY: The Public Interface, Coming Soon"),
    description: t(
      "marketing.pages.gvtewayTeaser.metadata.description",
      undefined,
      "GVTEWAY is the public side of the ecosystem: ticketing, stakeholder portals, and the marketplace. The marketplace is open today; ticketing and portals are coming. Join the waitlist.",
    ),
    path: "/gvteway",
    keywords: [
      "GVTEWAY",
      "event ticketing platform",
      "stakeholder portal software",
      "production marketplace",
      "crew marketplace",
    ],
    ogImageEyebrow: t("marketing.pages.gvtewayTeaser.metadata.ogImageEyebrow", undefined, "Coming Soon"),
    ogImageTitle: t("marketing.pages.gvtewayTeaser.metadata.ogImageTitle", undefined, "GVTEWAY: The Public Interface"),
  });
}

export default async function GvtewayTeaserPage() {
  const { t } = await getStaticEnT();

  const LIVE_SURFACES = [
    {
      key: "gigs",
      href: "/marketplace/gigs",
      name: t("marketing.pages.gvtewayTeaser.live.gigs.name", undefined, "Gigs and jobs"),
      body: t(
        "marketing.pages.gvtewayTeaser.live.gigs.body",
        undefined,
        "Open roles and gig postings from real productions, browsable without an account.",
      ),
    },
    {
      key: "talent",
      href: "/marketplace/talent",
      name: t("marketing.pages.gvtewayTeaser.live.talent.name", undefined, "Talent and crew"),
      body: t(
        "marketing.pages.gvtewayTeaser.live.talent.body",
        undefined,
        "Public talent EPKs and crew profiles, with open calls you can submit to today.",
      ),
    },
    {
      key: "rfqs",
      href: "/marketplace/rfqs",
      name: t("marketing.pages.gvtewayTeaser.live.rfqs.name", undefined, "RFQs and vendors"),
      body: t(
        "marketing.pages.gvtewayTeaser.live.rfqs.body",
        undefined,
        "Published RFQs from buying orgs and public vendor profiles ready to take a bid.",
      ),
    },
  ];

  const COMING = [
    {
      key: "ticketing",
      name: t("marketing.pages.gvtewayTeaser.coming.ticketing.name", undefined, "Ticketing"),
      body: t(
        "marketing.pages.gvtewayTeaser.coming.ticketing.body",
        undefined,
        "Tickets will live on the same record store as the production itself: tiers, zones, gate scans, and the guest's whole night on one record. Fast at the gate, honest in the counts.",
      ),
    },
    {
      key: "portals",
      name: t("marketing.pages.gvtewayTeaser.coming.portals.name", undefined, "Stakeholder portals"),
      body: t(
        "marketing.pages.gvtewayTeaser.coming.portals.body",
        undefined,
        "Artists, vendors, sponsors, media, and delegations will each get their own way in: documents, advances, schedules, and a direct line to their account manager. No forwarded PDFs.",
      ),
    },
  ];

  const FAQS = [
    {
      q: t("marketing.pages.gvtewayTeaser.faq.what.q", undefined, "What is GVTEWAY?"),
      a: t(
        "marketing.pages.gvtewayTeaser.faq.what.a",
        undefined,
        "GVTEWAY is the public interface of the ATLVS Technologies ecosystem: ticketing, stakeholder portals, and the marketplace. It's the side of the platform that guests, talent, vendors, and partners touch.",
      ),
    },
    {
      q: t("marketing.pages.gvtewayTeaser.faq.live.q", undefined, "What can I use right now?"),
      a: t(
        "marketing.pages.gvtewayTeaser.faq.live.a",
        undefined,
        "The marketplace is open today: gigs, open calls, talent EPKs, crew profiles, vendor directories, and published RFQs. Ticketing and the stakeholder portals are the parts still in the shop.",
      ),
    },
    {
      q: t("marketing.pages.gvtewayTeaser.faq.when.q", undefined, "When do ticketing and portals launch?"),
      a: t(
        "marketing.pages.gvtewayTeaser.faq.when.a",
        undefined,
        "There is no launch date to announce, and we won't invent one. Waitlist members get the news first, and the marketplace keeps growing in the meantime.",
      ),
    },
  ];

  const crumbs = [
    { label: t("marketing.pages.gvtewayTeaser.breadcrumbs.home", undefined, "Home"), href: "/" },
    { label: "GVTEWAY", href: "/gvteway" },
  ];

  return (
    <MarketingPageShell>
      <JsonLd data={[breadcrumbSchema(crumbs), faqSchema(FAQS)]} />

      <MarketingHero
        eyebrow={t("marketing.pages.gvtewayTeaser.hero.eyebrow", undefined, "GVTEWAY · Coming soon")}
        title={t("marketing.pages.gvtewayTeaser.hero.title", undefined, "Every World Needs A Way In")}
        subtitle={SITE.apps.gvteway.tagline}
        actions={
          <>
            <Link href="/marketplace" className="ps-btn">
              {t("marketing.pages.gvtewayTeaser.hero.ctaMarketplace", undefined, "Browse the live marketplace")}
            </Link>
            <a href="#waitlist" className="ps-btn ps-btn--ghost">
              {t("marketing.pages.gvtewayTeaser.hero.ctaWaitlist", undefined, "Join the waitlist")}
            </a>
          </>
        }
      />

      <MarketingSection
        eyebrow={t("marketing.pages.gvtewayTeaser.liveSection.eyebrow", undefined, "Open today")}
        title={t("marketing.pages.gvtewayTeaser.liveSection.title", undefined, "The Marketplace Is Already Open")}
        subtitle={t(
          "marketing.pages.gvtewayTeaser.liveSection.subtitle",
          undefined,
          "This isn't a mockup. The first GVTEWAY surface has been live for a while: real postings, real profiles, real RFQs.",
        )}
      >
        <MarketingGrid cols={3}>
          {LIVE_SURFACES.map((s) => (
            <Link key={s.key} href={s.href} className="surface hover-lift block p-6">
              <h3 className="font-semibold">{s.name}</h3>
              <p className="mt-2 text-sm text-[var(--p-text-2)]">{s.body}</p>
              <span className="mt-3 inline-block text-sm font-medium text-[var(--p-accent-text)]">
                {t("marketing.pages.gvtewayTeaser.liveSection.linkLabel", undefined, "See it live")}
              </span>
            </Link>
          ))}
        </MarketingGrid>
      </MarketingSection>

      <MarketingSection
        eyebrow={t("marketing.pages.gvtewayTeaser.comingSection.eyebrow", undefined, "In the shop")}
        title={t("marketing.pages.gvtewayTeaser.comingSection.title", undefined, "Ticketing And Portals Are Next")}
        subtitle={t(
          "marketing.pages.gvtewayTeaser.comingSection.subtitle",
          undefined,
          "The rest of GVTEWAY is in active development. No launch date until we have a real one.",
        )}
      >
        <MarketingGrid cols={2}>
          {COMING.map((c) => (
            <div key={c.key} className="surface p-6">
              <h3 className="font-semibold">{c.name}</h3>
              <p className="mt-2 text-sm text-[var(--p-text-2)]">{c.body}</p>
            </div>
          ))}
        </MarketingGrid>
      </MarketingSection>

      <MarketingSection
        id="waitlist"
        eyebrow={t("marketing.pages.gvtewayTeaser.waitlist.eyebrow", undefined, "Waitlist")}
        title={t("marketing.pages.gvtewayTeaser.waitlist.title", undefined, "Hear It First")}
        subtitle={t(
          "marketing.pages.gvtewayTeaser.waitlist.subtitle",
          undefined,
          "One email when ticketing and portals open. Nothing else.",
        )}
      >
        <div className="max-w-xl">
          <WaitlistForm product="gvteway" productName="GVTEWAY" />
        </div>
      </MarketingSection>

      <FAQSection faqs={FAQS} />

      <CTASection
        title={t("marketing.pages.gvtewayTeaser.cta.title", undefined, "Don't Wait At The Gate.")}
        subtitle={t(
          "marketing.pages.gvtewayTeaser.cta.subtitle",
          undefined,
          "The marketplace is live and free to browse. Post a gig, publish an RFQ, or put your EPK where buyers already look.",
        )}
        secondaryLabel={t("marketing.pages.gvtewayTeaser.cta.secondary", undefined, "Browse the marketplace")}
        secondaryHref="/marketplace"
      />
    </MarketingPageShell>
  );
}
