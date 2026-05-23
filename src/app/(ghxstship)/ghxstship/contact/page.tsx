import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SOLUTIONS, paths } from "@/lib/ghxstship";
import { GhxstshipJsonLd, breadcrumbSchema } from "@/components/ghxstship/JsonLd";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Contact GHXSTSHIP — Start a Project",
  description:
    "Brief GHXSTSHIP. A paragraph in plain English, an RFP, or a voice memo. We resolve every brief against the same services catalog and reply with scope, model, and producer assignment within one business day.",
  alternates: { canonical: "https://ghxstship.pro/ghxstship/contact" },
};

const ROUTES = [
  {
    label: "Start a Project",
    body: "New engagement, RFP, or scoping conversation. We reply with engagement model, producer assignment, and price band.",
    href: "mailto:studio@ghxstship.pro",
    line: "studio@ghxstship.pro",
  },
  {
    label: "Federation & Mega-Event",
    body: "Olympic, FIFA, F1, Super Bowl, World Cup, NCAA, OCOG-tier, federation accreditation, host-city liaison.",
    href: "mailto:federation@ghxstship.pro",
    line: "federation@ghxstship.pro",
  },
  {
    label: "Press & Partnerships",
    body: "Media, sponsorship inbound, brand collaborations, podcast asks, speaking engagements.",
    href: "mailto:press@ghxstship.pro",
    line: "press@ghxstship.pro",
  },
  {
    label: "Roster & Crew",
    body: "Producers, technicians, riggers, hospitality, fixers — apply with your portfolio and city. We onboard quarterly.",
    href: "mailto:roster@ghxstship.pro",
    line: "roster@ghxstship.pro",
  },
];

export default function ContactPage() {
  return (
    <>
      <GhxstshipJsonLd
        data={breadcrumbSchema([
          { label: "GHXSTSHIP", href: "/ghxstship" },
          { label: "Contact", href: "/ghxstship/contact" },
        ])}
      />
      <div className="space-y-20 pb-24">
        <section className="mx-auto max-w-6xl px-6 pt-16">
          <div className="text-xs font-semibold tracking-[0.25em] uppercase text-[var(--org-primary)]">
            Contact
          </div>
          <h1 className="mt-4 text-5xl uppercase sm:text-7xl font-display">
            Brief us.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-[var(--text-secondary)]">
            Tell us the brief, the date band, the venue or geography, and your scope. We&apos;ll come back inside one
            business day with the engagement model, the producer assignment, and a price band — or a request for the
            information we&apos;d need to scope it cleanly.
          </p>
        </section>

        <section className="mx-auto max-w-6xl px-6">
          <div className="grid gap-5 sm:grid-cols-2">
            {ROUTES.map((r) => (
              <a key={r.href} href={r.href} className="surface hover-lift group flex h-full flex-col p-6">
                <div className="text-xl uppercase font-display">
                  {r.label}
                </div>
                <p className="mt-3 text-sm text-[var(--text-secondary)]">{r.body}</p>
                <div
                  className="mt-4 inline-flex items-center gap-2 font-mono text-sm tracking-wide text-[var(--org-primary)]"
                >
                  {r.line}
                  <ArrowRight className="cta-nudge h-3.5 w-3.5" />
                </div>
              </a>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6">
          <div className="surface-raised p-8">
            <h2 className="text-2xl uppercase sm:text-3xl font-display">
              What to put in the email.
            </h2>
            <ul className="mt-6 grid gap-3 text-sm text-[var(--text-secondary)] sm:grid-cols-2">
              <li className="flex items-start gap-3">
                <span
                  className="mt-0.5 inline-block h-1.5 w-1.5 shrink-0"
                  style={{ background: "var(--org-accent)" }}
                />
                <span>
                  <strong className="text-[var(--text-primary)]">Brief.</strong> One paragraph is enough. We&apos;ll ask
                  the right follow-ups.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span
                  className="mt-0.5 inline-block h-1.5 w-1.5 shrink-0"
                  style={{ background: "var(--org-accent)" }}
                />
                <span>
                  <strong className="text-[var(--text-primary)]">Dates or window.</strong> Hard date or rolling window —
                  both are fine.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span
                  className="mt-0.5 inline-block h-1.5 w-1.5 shrink-0"
                  style={{ background: "var(--org-accent)" }}
                />
                <span>
                  <strong className="text-[var(--text-primary)]">Venue or geography.</strong> Specific address if
                  locked, market name if not.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span
                  className="mt-0.5 inline-block h-1.5 w-1.5 shrink-0"
                  style={{ background: "var(--org-accent)" }}
                />
                <span>
                  <strong className="text-[var(--text-primary)]">Audience size.</strong> Total guest count or daily
                  attendance.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span
                  className="mt-0.5 inline-block h-1.5 w-1.5 shrink-0"
                  style={{ background: "var(--org-accent)" }}
                />
                <span>
                  <strong className="text-[var(--text-primary)]">Budget envelope.</strong> Even a band — it sharpens the
                  engagement model fast.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span
                  className="mt-0.5 inline-block h-1.5 w-1.5 shrink-0"
                  style={{ background: "var(--org-accent)" }}
                />
                <span>
                  <strong className="text-[var(--text-primary)]">Constraints.</strong> Federation, union, host-city,
                  clean zone, brand-rights, NDA — flag them up front.
                </span>
              </li>
            </ul>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6">
          <div className="text-xs font-semibold tracking-[0.2em] text-[var(--text-muted)] uppercase">
            Or start by browsing
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {SOLUTIONS.slice(0, 9).map((s) => (
              <Link key={s.slug} href={paths.solutionDetail(s.slug)} className="surface hover-lift block p-4 text-sm">
                {s.name}
              </Link>
            ))}
          </div>
          <div className="mt-6">
            <Link
              href={paths.solutionsRoot()}
              className="text-sm font-semibold tracking-wide uppercase hover:text-[var(--org-primary)]"
            >
              All 19 industries →
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
