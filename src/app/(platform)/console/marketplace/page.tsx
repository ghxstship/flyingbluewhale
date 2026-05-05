import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters } from "@/lib/i18n/request";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function Page() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Marketplace" title="Overview" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = (await createClient()) as unknown as LooseSupabase;
  const fmt = await getRequestFormatters();

  const [postings, calls, offers, applications] = await Promise.all([
    supabase.from("job_postings").select("id, status").eq("org_id", session.orgId),
    supabase.from("open_calls").select("id, status").eq("org_id", session.orgId),
    supabase.from("talent_offers").select("id, status").eq("org_id", session.orgId),
    supabase.from("job_applications").select("id, status").eq("org_id", session.orgId),
  ]);

  const postingRows = (postings.data ?? []) as Array<{ status: string }>;
  const callRows = (calls.data ?? []) as Array<{ status: string }>;
  const offerRows = (offers.data ?? []) as Array<{ status: string }>;
  const appRows = (applications.data ?? []) as Array<{ status: string }>;

  const publishedPostings = postingRows.filter((r) => r.status === "published").length;
  const publishedCalls = callRows.filter((r) => r.status === "published").length;
  const liveOffers = offerRows.filter((r) => r.status === "sent" || r.status === "countered").length;
  const newApplicants = appRows.filter((r) => r.status === "new").length;

  return (
    <>
      <ModuleHeader
        eyebrow="Marketplace"
        title="Overview"
        subtitle="Public surfaces — RFQs, crew gigs, talent calls, offers."
        action={
          <Button href="/console/marketplace/settings" size="sm" variant="ghost">
            Settings
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-4">
          <MetricCard label="Live Postings" value={fmt.number(publishedPostings)} accent />
          <MetricCard label="Open Calls" value={fmt.number(publishedCalls)} />
          <MetricCard label="Active Offers" value={fmt.number(liveOffers)} />
          <MetricCard label="New Applicants" value={fmt.number(newApplicants)} />
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          <Tile
            title="Job Postings"
            href="/console/marketplace/postings"
            newHref="/console/marketplace/postings/new"
            blurb="Public crew job board. Single, tour-leg, or recurring. Reviews land in your ATS."
          />
          <Tile
            title="Open Calls"
            href="/console/marketplace/calls"
            newHref="/console/marketplace/calls/new"
            blurb="Casting calls and open RFPs. Submissions feed your shortlist."
          />
          <Tile
            title="Talent"
            href="/console/marketplace/talent"
            newHref="/console/marketplace/talent/new"
            blurb="EPK roster: act, riders, fee bands, availability, agent."
          />
          <Tile
            title="Offers"
            href="/console/marketplace/offers"
            newHref="/console/marketplace/offers/new"
            blurb="Talent offers, counters, contracts. 60/40 default; auto-builds advancing on accept."
          />
          <Tile
            title="RFQ Marketplace"
            href="/console/procurement/rfqs"
            newHref="/console/procurement/rfqs/new"
            blurb="Publish RFQs to the public marketplace with prequalification gates."
          />
          <Tile
            title="Reviews"
            href="/console/marketplace/reviews"
            blurb="Bidirectional reviews. Hidden until both sides post — no retaliation surface."
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
      <p className="text-xs text-[var(--text-secondary)]">{blurb}</p>
    </div>
  );
}
