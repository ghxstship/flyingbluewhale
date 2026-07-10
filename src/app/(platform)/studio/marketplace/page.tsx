import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.marketplace.eyebrow", undefined, "Marketplace")}
          title={t("console.marketplace.title", undefined, "Overview")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.marketplace.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();

  // B-22: server-side aggregates — `count: "exact", head: true` per tile
  // instead of fetching every row across four tables just to count in JS.
  const [postings, calls, offers, applications] = await Promise.all([
    supabase
      .from("job_postings")
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null)
      .eq("org_id", session.orgId)
      .eq("job_posting_phase", "published"),
    supabase
      .from("open_calls")
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null)
      .eq("org_id", session.orgId)
      .eq("open_call_phase", "published"),
    supabase
      .from("talent_offers")
      .select("id", { count: "exact", head: true })
      .eq("org_id", session.orgId)
      .in("talent_offer_state", ["sent", "countered"]),
    supabase
      .from("job_applications")
      .select("id", { count: "exact", head: true })
      .eq("org_id", session.orgId)
      .eq("job_application_state", "new"),
  ]);

  const publishedPostings = postings.count ?? 0;
  const publishedCalls = calls.count ?? 0;
  const liveOffers = offers.count ?? 0;
  const newApplicants = applications.count ?? 0;

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.marketplace.eyebrow", undefined, "Marketplace")}
        title={t("console.marketplace.title", undefined, "Overview")}
        subtitle={t(
          "console.marketplace.subtitle",
          undefined,
          "Public surfaces: RFQs, crew gigs, talent calls, offers.",
        )}
        action={
          <Button href="/studio/marketplace/settings" size="sm" variant="ghost">
            {t("console.marketplace.settingsLabel", undefined, "Settings")}
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-4">
          {/* Metric cards double as nav into their sub-module. */}
          <Link href="/studio/marketplace/postings" className="hover-lift focus-ring block rounded-[var(--p-r)]">
            <MetricCard
              label={t("console.marketplace.metrics.livePostings", undefined, "Live Postings")}
              value={fmt.number(publishedPostings)}
              accent
            />
          </Link>
          <Link href="/studio/marketplace/calls" className="hover-lift focus-ring block rounded-[var(--p-r)]">
            <MetricCard
              label={t("console.marketplace.metrics.openCalls", undefined, "Open Calls")}
              value={fmt.number(publishedCalls)}
            />
          </Link>
          <Link href="/studio/marketplace/offers" className="hover-lift focus-ring block rounded-[var(--p-r)]">
            <MetricCard
              label={t("console.marketplace.metrics.activeOffers", undefined, "Active Offers")}
              value={fmt.number(liveOffers)}
            />
          </Link>
          <Link href="/studio/marketplace/postings" className="hover-lift focus-ring block rounded-[var(--p-r)]">
            <MetricCard
              label={t("console.marketplace.metrics.newApplicants", undefined, "New Applicants")}
              value={fmt.number(newApplicants)}
            />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          <Tile
            title={t("console.marketplace.tiles.postings.title", undefined, "Job Postings")}
            href="/studio/marketplace/postings"
            newHref="/studio/marketplace/postings/new"
            blurb={t(
              "console.marketplace.tiles.postings.blurb",
              undefined,
              "Public crew job board. Single, tour-leg, or recurring. Reviews land in your ATS.",
            )}
          />
          <Tile
            title={t("console.marketplace.tiles.calls.title", undefined, "Open Calls")}
            href="/studio/marketplace/calls"
            newHref="/studio/marketplace/calls/new"
            blurb={t(
              "console.marketplace.tiles.calls.blurb",
              undefined,
              "Casting calls and open RFPs. Submissions feed your shortlist.",
            )}
          />
          <Tile
            title={t("console.marketplace.tiles.talent.title", undefined, "Talent")}
            href="/studio/marketplace/talent"
            newHref="/studio/marketplace/talent/new"
            blurb={t(
              "console.marketplace.tiles.talent.blurb",
              undefined,
              "EPK roster: act, riders, fee bands, availability, agent.",
            )}
          />
          <Tile
            title={t("console.marketplace.tiles.offers.title", undefined, "Offers")}
            href="/studio/marketplace/offers"
            newHref="/studio/marketplace/offers/new"
            blurb={t(
              "console.marketplace.tiles.offers.blurb",
              undefined,
              "Talent offers, counters, contracts. 60/40 default; auto-builds advancing on accept.",
            )}
          />
          <Tile
            title={t("console.marketplace.tiles.rfq.title", undefined, "RFQ Marketplace")}
            href="/studio/procurement/rfqs"
            newHref="/studio/procurement/rfqs/new"
            blurb={t(
              "console.marketplace.tiles.rfq.blurb",
              undefined,
              "Publish RFQs to the public marketplace with prequalification gates.",
            )}
          />
          <Tile
            title={t("console.marketplace.tiles.inquiries.title", undefined, "Inquiries")}
            href="/studio/marketplace/inquiries"
            blurb={t(
              "console.marketplace.tiles.inquiries.blurb",
              undefined,
              "Quote requests and booking inquiries from your public profiles and RFQs.",
            )}
          />
          <Tile
            title={t("console.marketplace.tiles.reviews.title", undefined, "Reviews")}
            href="/studio/marketplace/reviews"
            blurb={t(
              "console.marketplace.tiles.reviews.blurb",
              undefined,
              "Bidirectional reviews. Hidden until both sides post, so there is no retaliation surface.",
            )}
          />
        </div>
      </div>
    </>
  );
}

function Tile({ title, href, blurb, newHref }: { title: string; href: string; blurb: string; newHref?: string }) {
  return (
    <div className="surface flex flex-col gap-2 p-5">
      <div className="flex items-start justify-between gap-2">
        <Link href={href} className="text-sm font-semibold tracking-wide uppercase">
          {title}
        </Link>
        {newHref && (
          <Button size="sm" variant="ghost" href={newHref}>
            +
          </Button>
        )}
      </div>
      <p className="text-xs text-[var(--p-text-2)]">{blurb}</p>
    </div>
  );
}
