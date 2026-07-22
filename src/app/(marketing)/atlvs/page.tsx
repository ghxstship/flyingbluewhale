import type { Metadata } from "next";
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
    title: t("marketing.pages.atlvsTeaser.metadata.title", undefined, "ATLVS: The Operator Console, Coming Soon"),
    description: t(
      "marketing.pages.atlvsTeaser.metadata.description",
      undefined,
      "ATLVS is the operator console we're building now: ERP, CRM, and project management on one record store, with the Sell to Settle spine and the Coordinate Matrix task lens. Join the waitlist.",
    ),
    path: "/atlvs",
    keywords: [
      "ATLVS console",
      "event production ERP",
      "production management console",
      "sell to settle",
      "coordinate matrix",
    ],
    ogImageEyebrow: t("marketing.pages.atlvsTeaser.metadata.ogImageEyebrow", undefined, "Coming Soon"),
    ogImageTitle: t("marketing.pages.atlvsTeaser.metadata.ogImageTitle", undefined, "ATLVS: The Operator Console"),
  });
}

export default async function AtlvsTeaserPage() {
  const { t } = await getStaticEnT();

  const PILLARS = [
    {
      key: "spine",
      name: t("marketing.pages.atlvsTeaser.pillars.spine.name", undefined, "The Sell to Settle spine"),
      body: t(
        "marketing.pages.atlvsTeaser.pillars.spine.body",
        undefined,
        "Every production will run the same eight-phase arc, from the first pitch to the final settlement. The console will show you exactly which phase you're in and what has to be true before the next gate opens.",
      ),
    },
    {
      key: "matrix",
      name: t("marketing.pages.atlvsTeaser.pillars.matrix.name", undefined, "The Coordinate Matrix task lens"),
      body: t(
        "marketing.pages.atlvsTeaser.pillars.matrix.body",
        undefined,
        "Work plotted as phase by department: 90 coordinates that tell you what production owes design in week three, and what finance owes everyone at close. You'll see the whole build on one grid.",
      ),
    },
    {
      key: "advancing",
      name: t("marketing.pages.atlvsTeaser.pillars.advancing.name", undefined, "Advancing packets"),
      body: t(
        "marketing.pages.atlvsTeaser.pillars.advancing.body",
        undefined,
        "One packet out per counterparty, one structured submission back, against a real deadline. Crew lists, travel grids, rider uploads. The chase ladder will run itself so you don't have to.",
      ),
    },
    {
      key: "records",
      name: t("marketing.pages.atlvsTeaser.pillars.records.name", undefined, "Finance and procurement on one record store"),
      body: t(
        "marketing.pages.atlvsTeaser.pillars.records.body",
        undefined,
        "Proposals, budgets, purchase orders, invoices, and expenses will live on the same records as the work itself. When the show settles, the numbers are already where they need to be.",
      ),
    },
  ];

  const FAQS = [
    {
      q: t("marketing.pages.atlvsTeaser.faq.what.q", undefined, "What is ATLVS?"),
      a: t(
        "marketing.pages.atlvsTeaser.faq.what.a",
        undefined,
        "ATLVS is the operator console of the ATLVS Technologies ecosystem: ERP, CRM, and project management for experiential production, built on one shared record store. It covers the full arc from selling the work to settling it.",
      ),
    },
    {
      q: t("marketing.pages.atlvsTeaser.faq.when.q", undefined, "When does it launch?"),
      a: t(
        "marketing.pages.atlvsTeaser.faq.when.a",
        undefined,
        "We haven't set a date, and we won't announce one until we're sure of it. The waitlist is the first place we'll say so. In the meantime COMPVSS, the field operations app, is live today.",
      ),
    },
    {
      q: t("marketing.pages.atlvsTeaser.faq.waitlist.q", undefined, "What does joining the waitlist get me?"),
      a: t(
        "marketing.pages.atlvsTeaser.faq.waitlist.a",
        undefined,
        "One email when ATLVS opens, and a spot near the front of the line for early access. We don't run drip campaigns and we don't share the list with anyone.",
      ),
    },
  ];

  const crumbs = [
    { label: t("marketing.pages.atlvsTeaser.breadcrumbs.home", undefined, "Home"), href: "/" },
    { label: "ATLVS", href: "/atlvs" },
  ];

  return (
    <MarketingPageShell>
      <JsonLd data={[breadcrumbSchema(crumbs), faqSchema(FAQS)]} />

      <MarketingHero
        eyebrow={t("marketing.pages.atlvsTeaser.hero.eyebrow", undefined, "ATLVS · Coming soon")}
        title={t("marketing.pages.atlvsTeaser.hero.title", undefined, "The Operator Console Is On The Bench")}
        subtitle={SITE.apps.atlvs.tagline}
        actions={
          <a href="#waitlist" className="ps-btn">
            {t("marketing.pages.atlvsTeaser.hero.cta", undefined, "Join the waitlist")}
          </a>
        }
      />

      <MarketingSection
        eyebrow={t("marketing.pages.atlvsTeaser.pillarsSection.eyebrow", undefined, "What we're building")}
        title={t("marketing.pages.atlvsTeaser.pillarsSection.title", undefined, "ERP, CRM, and PM on one record store")}
        subtitle={t(
          "marketing.pages.atlvsTeaser.pillarsSection.subtitle",
          undefined,
          "One console where the proposal, the build, the crew, and the money share the same records.",
        )}
      >
        <MarketingGrid cols={2}>
          {PILLARS.map((p) => (
            <div key={p.key} className="surface p-6">
              <h3 className="font-semibold">{p.name}</h3>
              <p className="mt-2 text-sm text-[var(--p-text-2)]">{p.body}</p>
            </div>
          ))}
        </MarketingGrid>
      </MarketingSection>

      <MarketingSection
        eyebrow={t("marketing.pages.atlvsTeaser.honest.eyebrow", undefined, "Where it stands")}
        title={t("marketing.pages.atlvsTeaser.honest.title", undefined, "Being built now. No fake launch date.")}
      >
        <p className="max-w-2xl text-[var(--p-text-2)]">
          {t(
            "marketing.pages.atlvsTeaser.honest.body",
            undefined,
            "ATLVS is in active development on the same platform that already runs COMPVSS in the field. We'd rather ship it right than ship it loud, so the only date we'll ever give you is a real one. Waitlist members hear first.",
          )}
        </p>
      </MarketingSection>

      <MarketingSection
        id="waitlist"
        eyebrow={t("marketing.pages.atlvsTeaser.waitlist.eyebrow", undefined, "Waitlist")}
        title={t("marketing.pages.atlvsTeaser.waitlist.title", undefined, "Be First Through The Door")}
        subtitle={t(
          "marketing.pages.atlvsTeaser.waitlist.subtitle",
          undefined,
          "One email when it opens. That's the whole deal.",
        )}
      >
        <div className="max-w-xl">
          <WaitlistForm product="atlvs" productName="ATLVS" />
        </div>
      </MarketingSection>

      <FAQSection faqs={FAQS} />

      <CTASection
        title={t("marketing.pages.atlvsTeaser.cta.title", undefined, "Meanwhile, The Ecosystem Is Open.")}
        subtitle={t(
          "marketing.pages.atlvsTeaser.cta.subtitle",
          undefined,
          "COMPVSS runs crews in the field today, and the marketplace is live. Start there and ATLVS will meet you where your records already are.",
        )}
      />
    </MarketingPageShell>
  );
}
