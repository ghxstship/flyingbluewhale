import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Button } from "@/components/ui/Button";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Marketplace — Live Production Crew, Talent, RFQs",
  description:
    "Discover open production gigs, casting calls, talent, vetted crew, and live RFQs from the ATLVS network.",
  path: "/marketplace",
});

const SECTIONS = [
  {
    href: "/marketplace/rfqs",
    title: "Open RFQs",
    blurb: "Production RFPs from operators in our network. Bid through prequalification.",
  },
  {
    href: "/marketplace/gigs",
    title: "Crew Gigs",
    blurb: "Posting board for paid production roles — single show, tour leg, or recurring.",
  },
  {
    href: "/marketplace/calls",
    title: "Open Calls",
    blurb: "Casting calls and open submissions for talent, vendors, and creators.",
  },
  {
    href: "/marketplace/talent",
    title: "Talent",
    blurb: "Artist EPKs — bio, reel, riders, fee bands, agent. Direct booking.",
  },
  {
    href: "/marketplace/crew",
    title: "Crew",
    blurb: "Vetted production crew profiles — roles, gear, unions, day rates.",
  },
  {
    href: "/marketplace/vendors",
    title: "Vendors",
    blurb: "Production vendors with current insurance, W-9, and prequalification.",
  },
];

export default function Page() {
  return (
    <main className="page-content space-y-8">
      <Breadcrumbs items={[{ label: "Marketplace" }]} />
      <header className="space-y-3">
        <p className="eyebrow">Marketplace</p>
        <h1 className="hed-2xl">FIND THE WORK. FIND THE CREW. FIND THE ACT.</h1>
        <p className="max-w-2xl text-base text-[var(--text-secondary)]">
          One network for production RFQs, crew gigs, casting calls, and direct artist booking. Vetted, not
          crowdsourced. Bidirectional reviews. Bid + book + advance, end to end.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {SECTIONS.map((s) => (
          <Link key={s.href} href={s.href} className="surface hover-lift flex flex-col gap-2 p-5">
            <h2 className="text-base font-semibold tracking-wide uppercase">{s.title}</h2>
            <p className="text-sm text-[var(--text-secondary)]">{s.blurb}</p>
          </Link>
        ))}
      </div>

      <section className="surface p-6">
        <h2 className="mb-2 text-sm font-semibold tracking-wide uppercase">For Operators</h2>
        <p className="mb-3 text-sm text-[var(--text-secondary)]">
          Publish your own RFQs, gigs, and casting calls — gated by your prequalification rules.
        </p>
        <Button href="/signup" size="sm">
          Sign Up Free
        </Button>
      </section>
    </main>
  );
}
