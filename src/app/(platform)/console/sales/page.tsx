import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";

/**
 * Sales hub (ADR-0006). The four-section landing: Pipeline & Partners ·
 * Hospitality · Marketplace · Revenue. Pipeline survives as the default
 * kanban view on /console/leads (no separate sidebar entry per ADR-0006
 * §"Resolved decisions" #1). Hospitality is the canonical Sales surface
 * covering Talent / Sponsors / Athletes / Industry / Media & Press /
 * VVIP — distinct from Operations → Guest Experience (audience-facing).
 */
export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Sales" title="Sales" subtitle="Pipeline, partnerships, marketplace, revenue." />
      <div className="page-content space-y-6">
        <section>
          <h2 className="text-xs font-semibold tracking-wider text-[var(--p-text-2)] uppercase">
            Pipeline &amp; Partners
          </h2>
          <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Link className="surface hover-lift p-4" href="/console/leads">
              <div className="text-sm font-medium">Leads</div>
              <div className="mt-1 text-xs text-[var(--p-text-2)]">Pipeline kanban + saved views</div>
            </Link>
            <Link className="surface hover-lift p-4" href="/console/clients">
              <div className="text-sm font-medium">Clients</div>
            </Link>
            <Link className="surface hover-lift p-4" href="/console/commercial/sponsors">
              <div className="text-sm font-medium">Sponsors</div>
            </Link>
            <Link className="surface hover-lift p-4" href="/console/marketing">
              <div className="text-sm font-medium">Marketing</div>
            </Link>
          </div>
        </section>

        <section>
          <h2 className="text-xs font-semibold tracking-wider text-[var(--p-text-2)] uppercase">Hospitality</h2>
          <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Link className="surface hover-lift p-4" href="/console/commercial/hospitality">
              <div className="text-sm font-medium">Hospitality</div>
              <div className="mt-1 text-xs text-[var(--p-text-2)]">
                Talent · Sponsors · Athletes · Industry · Media &amp; Press · VVIP
              </div>
            </Link>
          </div>
        </section>

        <section>
          <h2 className="text-xs font-semibold tracking-wider text-[var(--p-text-2)] uppercase">Marketplace</h2>
          <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Link className="surface hover-lift p-4" href="/console/marketplace">
              <div className="text-sm font-medium">Marketplace</div>
              <div className="mt-1 text-xs text-[var(--p-text-2)]">Postings, calls, talent, offers, reviews</div>
            </Link>
            <Link className="surface hover-lift p-4" href="/console/bookings">
              <div className="text-sm font-medium">Bookings</div>
              <div className="mt-1 text-xs text-[var(--p-text-2)]">Deals, holds, calendar, settlements</div>
            </Link>
            <Link className="surface hover-lift p-4" href="/console/agency/tours">
              <div className="text-sm font-medium">Tours</div>
            </Link>
            <Link className="surface hover-lift p-4" href="/console/marketplace/talent">
              <div className="text-sm font-medium">Talent Roster</div>
            </Link>
            <Link className="surface hover-lift p-4" href="/console/marketplace/offers">
              <div className="text-sm font-medium">Offers</div>
            </Link>
          </div>
        </section>

        <section>
          <h2 className="text-xs font-semibold tracking-wider text-[var(--p-text-2)] uppercase">Revenue</h2>
          <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Link className="surface hover-lift p-4" href="/console/commercial/tickets">
              <div className="text-sm font-medium">Tickets</div>
            </Link>
            <Link className="surface hover-lift p-4" href="/console/insights">
              <div className="text-sm font-medium">Analytics</div>
              <div className="mt-1 text-xs text-[var(--p-text-2)]">Cross-cutting BI rollup</div>
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
