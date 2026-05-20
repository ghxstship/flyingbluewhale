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
    <>
      <Breadcrumbs items={[{ label: "Marketplace" }]} className="mx-auto max-w-6xl px-6 pt-6" />

      <section className="mx-auto max-w-6xl px-6 pt-8 pb-12">
        <div className="eyebrow eyebrow-accent">Marketplace</div>
        <h1 className="hed-2xl mt-4">Find the Work. Find the Crew. Find the Act.</h1>
        <p className="mt-5 max-w-2xl text-lg text-[var(--text-secondary)]">
          One network for production RFQs, crew gigs, casting calls, and direct artist booking. Vetted, not
          crowdsourced. Bidirectional reviews. Bid + book + advance, end to end.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-12">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {SECTIONS.map((s) => (
            <Link key={s.href} href={s.href} className="surface hover-lift flex flex-col gap-2 p-5">
              <h2 className="hed-lg">{s.title}</h2>
              <p className="text-sm text-[var(--text-secondary)]">{s.blurb}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="surface p-6">
          <h2 className="hed-lg mb-2">For Operators</h2>
          <p className="mb-3 text-sm text-[var(--text-secondary)]">
            Publish your own RFQs, gigs, and casting calls — gated by your prequalification rules.
          </p>
          <Button href="/signup" size="sm">
            Sign Up Free
          </Button>
        </div>
      </section>
    </>
  );
}
