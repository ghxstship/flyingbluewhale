import Link from "next/link";
import { Accordion } from "@/components/ui/Accordion";
import { Button } from "@/components/ui/Button";
import { urlFor } from "@/lib/urls";

/**
 * LEG3ND for Institutions — the public B2B capture surface in the LEG3ND funnel
 * (ADR-0011 / IMPLEMENTATION §2). Logged-out: positions the standalone LMS /
 * knowledge base as an integration point for other institutions' training, with
 * an FAQ on the kit Accordion. No auth gate (public funnel).
 */
const FAQ = [
  {
    title: "Can we run our own training on LEG3ND?",
    content:
      "Yes. LEG3ND is a standalone LMS + knowledge base on the XPMS 2.0 protocol. Author courses, certifications, and resources, then gate field scans in COMPVSS on the credentials your learners earn.",
  },
  {
    title: "How does certification sync to the field?",
    content:
      "Earned certifications and points flow to the same record store the rest of the ecosystem runs on — a credential earned in LEG3ND can gate a gate scan in COMPVSS the same day.",
  },
  {
    title: "Is the signage library included?",
    content:
      "The 60 public-domain AIGA / U.S. DOT wayfinding symbols ship with every workspace, color-mapped to the airport tone system — usable in your courses, plans, and on-site signage.",
  },
  {
    title: "Do you support SSO for our learners?",
    content:
      "Institution accounts authenticate through the shared auth layer (SSO across every ecosystem subdomain), so a learner signs in once and carries their progress everywhere.",
  },
];

export default function ForInstitutionsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <header className="space-y-3">
        <p className="eyebrow eyebrow-accent">LEG3ND · For Institutions</p>
        <h1>Hold the standard for your whole organization.</h1>
        <p className="text-lg text-[var(--p-text-2)]">
          A standalone LMS, knowledge base, and resource hub on the XPMS 2.0 protocol — wired into the same record store
          your field operations run on. Train, certify, and recertify, then let those credentials gate real work.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Button href={urlFor("marketing", "/contact")} variant="cta">
            Talk to us
          </Button>
          <Link
            href="/legend"
            className="rounded-[var(--p-r,8px)] border border-[var(--p-border-2)] px-5 py-2.5 text-sm font-semibold text-[var(--p-text-1)] transition-colors hover:bg-[var(--p-surface-2)]"
          >
            Browse the catalog
          </Link>
        </div>
      </header>

      <section className="space-y-3">
        <h2 className="eyebrow">Common questions</h2>
        <Accordion items={FAQ} defaultOpen={[0]} />
      </section>
    </div>
  );
}
