import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { getRequestT } from "@/lib/i18n/request";

/**
 * Sales hub (ADR-0006). The four-section landing: Pipeline & Partners ·
 * Hospitality · Marketplace · Revenue. Pipeline survives as the default
 * kanban view on /console/leads (no separate sidebar entry per ADR-0006
 * §"Resolved decisions" #1). Hospitality is the canonical Sales surface
 * covering Talent / Sponsors / Athletes / Industry / Media & Press /
 * VVIP — distinct from Operations → Guest Experience (audience-facing).
 */
export default async function Page() {
  const { t } = await getRequestT();
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.sales.hub.eyebrow", undefined, "Sales")}
        title={t("console.sales.hub.title", undefined, "Sales")}
        subtitle={t("console.sales.hub.subtitle", undefined, "Pipeline, partnerships, marketplace, revenue.")}
      />
      <div className="page-content space-y-6">
        <section>
          <h2 className="text-xs font-semibold tracking-wider text-[var(--p-text-2)] uppercase">
            {t("console.sales.hub.sections.pipeline", undefined, "Pipeline & Partners")}
          </h2>
          <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Link className="surface hover-lift p-4" href="/console/leads">
              <div className="text-sm font-medium">{t("console.sales.hub.cards.leads", undefined, "Leads")}</div>
              <div className="mt-1 text-xs text-[var(--p-text-2)]">
                {t("console.sales.hub.cards.leadsDesc", undefined, "Pipeline kanban + saved views")}
              </div>
            </Link>
            <Link className="surface hover-lift p-4" href="/console/clients">
              <div className="text-sm font-medium">{t("console.sales.hub.cards.clients", undefined, "Clients")}</div>
            </Link>
            <Link className="surface hover-lift p-4" href="/console/commercial/sponsors">
              <div className="text-sm font-medium">{t("console.sales.hub.cards.sponsors", undefined, "Sponsors")}</div>
            </Link>
            <Link className="surface hover-lift p-4" href="/console/marketing">
              <div className="text-sm font-medium">
                {t("console.sales.hub.cards.marketing", undefined, "Marketing")}
              </div>
            </Link>
          </div>
        </section>

        <section>
          <h2 className="text-xs font-semibold tracking-wider text-[var(--p-text-2)] uppercase">
            {t("console.sales.hub.sections.hospitality", undefined, "Hospitality")}
          </h2>
          <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Link className="surface hover-lift p-4" href="/console/commercial/hospitality">
              <div className="text-sm font-medium">
                {t("console.sales.hub.cards.hospitality", undefined, "Hospitality")}
              </div>
              <div className="mt-1 text-xs text-[var(--p-text-2)]">
                {t(
                  "console.sales.hub.cards.hospitalityDesc",
                  undefined,
                  "Talent · Sponsors · Athletes · Industry · Media & Press · VVIP",
                )}
              </div>
            </Link>
          </div>
        </section>

        <section>
          <h2 className="text-xs font-semibold tracking-wider text-[var(--p-text-2)] uppercase">
            {t("console.sales.hub.sections.marketplace", undefined, "Marketplace")}
          </h2>
          <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Link className="surface hover-lift p-4" href="/console/marketplace">
              <div className="text-sm font-medium">
                {t("console.sales.hub.cards.marketplace", undefined, "Marketplace")}
              </div>
              <div className="mt-1 text-xs text-[var(--p-text-2)]">
                {t("console.sales.hub.cards.marketplaceDesc", undefined, "Postings, calls, talent, offers, reviews")}
              </div>
            </Link>
            <Link className="surface hover-lift p-4" href="/console/bookings">
              <div className="text-sm font-medium">{t("console.sales.hub.cards.bookings", undefined, "Bookings")}</div>
              <div className="mt-1 text-xs text-[var(--p-text-2)]">
                {t("console.sales.hub.cards.bookingsDesc", undefined, "Deals, holds, calendar, settlements")}
              </div>
            </Link>
            <Link className="surface hover-lift p-4" href="/console/agency/tours">
              <div className="text-sm font-medium">{t("console.sales.hub.cards.tours", undefined, "Tours")}</div>
            </Link>
            <Link className="surface hover-lift p-4" href="/console/marketplace/talent">
              <div className="text-sm font-medium">
                {t("console.sales.hub.cards.talentRoster", undefined, "Talent Roster")}
              </div>
            </Link>
            <Link className="surface hover-lift p-4" href="/console/marketplace/offers">
              <div className="text-sm font-medium">{t("console.sales.hub.cards.offers", undefined, "Offers")}</div>
            </Link>
          </div>
        </section>

        <section>
          <h2 className="text-xs font-semibold tracking-wider text-[var(--p-text-2)] uppercase">
            {t("console.sales.hub.sections.revenue", undefined, "Revenue")}
          </h2>
          <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Link className="surface hover-lift p-4" href="/console/marketplace/box-office">
              <div className="text-sm font-medium">{t("console.sales.hub.cards.tickets", undefined, "Box Office")}</div>
            </Link>
            <Link className="surface hover-lift p-4" href="/console/insights">
              <div className="text-sm font-medium">
                {t("console.sales.hub.cards.analytics", undefined, "Analytics")}
              </div>
              <div className="mt-1 text-xs text-[var(--p-text-2)]">
                {t("console.sales.hub.cards.analyticsDesc", undefined, "Cross-cutting BI rollup")}
              </div>
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
