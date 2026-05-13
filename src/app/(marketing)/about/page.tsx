// Static page — pre-render at build, no streaming Suspense on client nav.

import type { Metadata } from "next";
import Link from "next/link";
import { Compass, Layers, Rocket, ShieldCheck } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { JsonLd } from "@/components/marketing/JsonLd";
import { CTASection } from "@/components/marketing/CTASection";
import { buildMetadata, organizationSchema } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "About — The Studio",
  description:
    "ATLVS Technologies builds the platform for production. ATLVS, GVTEWAY, COMPVSS — three apps, one schema. Shipped by operators who&apos;ve run the room.",
  path: "/about",
  keywords: [
    "ATLVS Technologies about",
    "ATLVS",
    "GVTEWAY",
    "COMPVSS",
    "event production platform",
    "production software company",
  ],
  ogImageEyebrow: "The Studio",
  ogImageTitle: "Built by the People Who Run the Show.",
});

const PRINCIPLES = [
  {
    icon: Layers,
    title: "Three apps. One schema.",
    body: "ATLVS, GVTEWAY, COMPVSS share identity, data, and design. One database underneath.",
  },
  {
    icon: ShieldCheck,
    title: "RLS at the database.",
    body: "Tenant walled in Postgres, not in the UI. Immutable audit log on every change. Signed webhooks. Standard on every tier.",
  },
  {
    icon: Rocket,
    title: "Tested in the room.",
    body: "We ship to a real production the weekend before each release. If it doesn&apos;t survive load-in, it doesn&apos;t ship.",
  },
  {
    icon: Compass,
    title: "Per org. Never per seat.",
    body: "No per-seat trap. No per-scan tax. No velvet-rope gates on things that should be standard. Pricing reads like one number, not a tax form.",
  },
];

const MILESTONES = [
  {
    date: "2026 Q2",
    title: "Procore parity",
    body: "RFIs, submittals, daily logs, punch list, payment apps, change orders. Plus everything Procore won&apos;t touch.",
  },
  {
    date: "2026 Q1",
    title: "Three apps on one schema",
    body: "ATLVS, GVTEWAY, COMPVSS shipped on one database — console, portal, field.",
  },
  {
    date: "2025 Q4",
    title: "KBYG event guides",
    body: "One Know-Before-You-Go, authored once, rendered per-persona across portal and field.",
  },
  {
    date: "2025 Q3",
    title: "Proposals, signed in place",
    body: "Twenty-three block types. Live pricing. E-sign in the page. One URL replaces the PDF email thread.",
  },
  {
    date: "2025 Q2",
    title: "Stripe Connect payouts + advancing",
    body: "Vendor payouts via Connect. Sixteen typed deliverables with history, comments, attachments.",
  },
  {
    date: "2025 Q1",
    title: "First production shipped",
    body: "Staffed and scanned a 2,000-cap show end-to-end on the platform. Stage went down. The platform didn&apos;t.",
  },
];

export default function AboutPage() {
  const crumbs = [
    { label: "Home", href: "/" },
    { label: "About", href: "/about" },
  ];

  return (
    <div>
      <JsonLd data={[organizationSchema()]} />
      <Breadcrumbs items={crumbs} className="mx-auto max-w-6xl px-6 pt-6" />

      <section className="mx-auto max-w-6xl px-6 pt-8 pb-12">
        <div className="text-xs font-semibold tracking-[0.25em] text-[var(--org-primary)] uppercase">The Studio</div>
        <h1 className="mt-3 text-5xl font-semibold tracking-tight sm:text-6xl">
          Built by the People Who Run the Show.
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-[var(--text-secondary)]">
          ATLVS Technologies builds the platform for production. Every module came out of opening a spreadsheet for the
          third time and saying &quot;why isn&apos;t this in the platform.&quot;
        </p>
        <p className="mt-4 max-w-2xl text-sm text-[var(--text-secondary)]">
          Three apps. One schema. Forty-seven modules. We ship to real productions the weekend before each release. The
          work decides what stays in.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">How We Build.</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {PRINCIPLES.map(({ icon: Icon, title, body }) => (
            <div key={title} className="surface p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--org-primary)]/10 text-[var(--org-primary)]">
                  <Icon size={18} />
                </div>
                <div className="text-sm font-semibold">{title}</div>
              </div>
              <p className="mt-3 text-sm text-[var(--text-secondary)]">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">What Shipped, When.</h2>
        <ul className="mt-8 space-y-6">
          {MILESTONES.map((m) => (
            <li key={m.date} className="surface grid gap-2 p-6 md:grid-cols-[140px_1fr] md:items-start md:gap-6">
              <div className="font-mono text-xs text-[var(--text-muted)]">{m.date}</div>
              <div>
                <div className="text-sm font-semibold">{m.title}</div>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">{m.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="surface p-10">
          <h2 className="text-3xl font-semibold tracking-tight">Who Builds It.</h2>
          <p className="mt-4 max-w-2xl text-sm text-[var(--text-secondary)]">
            ATLVS is a production + technology studio. We&apos;ve staffed residencies, touring runs, private launches,
            gallery programs, brand activations. We shipped software for every one of them. The platform is a decade of
            in-the-field instinct, compressed into one console.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 text-sm">
            <Link className="underline underline-offset-4" href="/careers">
              Join the studio
            </Link>
            <span className="text-[var(--text-muted)]">·</span>
            <Link className="underline underline-offset-4" href="/contact">
              Talk to the studio
            </Link>
            <span className="text-[var(--text-muted)]">·</span>
            <a
              className="underline underline-offset-4"
              href="https://github.com/ghxstship"
              target="_blank"
              rel="noreferrer"
            >
              GitHub
            </a>
          </div>
        </div>
      </section>

      <CTASection
        title="Open the Console."
        subtitle="Free forever for small teams. Per-org pricing the rest of the way up."
        primaryLabel="Open the console"
        primaryHref="/signup"
        secondaryLabel="Talk to the studio"
        secondaryHref="/contact"
      />
    </div>
  );
}
