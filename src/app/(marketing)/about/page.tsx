// Static page — pre-render at build, no streaming Suspense on client nav.
export const dynamic = "force-static";

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
    "Second Star Technologies is the studio behind ATLVS, GVTEWAY, and COMPVSS. A decade of producers&apos; instinct, distilled into one Atlas. Written by the people who book the rooms.",
  path: "/about",
  keywords: ["Second Star Technologies about", "ATLVS", "GVTEWAY", "COMPVSS", "event production platform", "production software company"],
  ogImageEyebrow: "The Studio",
  ogImageTitle: "Written by the people who book the rooms.",
});

const PRINCIPLES = [
  { icon: Layers, title: "One manifest, three rooms", body: "ATLVS, GVTEWAY, and COMPVSS share identity, data, and design. One Atlas underneath." },
  { icon: ShieldCheck, title: "Private by architecture", body: "Manifest walled at the database. Immutable audit log on every hit. Signed webhooks. Standard on GA, not promised on Festival." },
  { icon: Rocket, title: "Tested at the door", body: "Every major release runs on a real room the weekend before it ships. If it doesn&apos;t survive load-in, it doesn&apos;t ship." },
  { icon: Compass, title: "Honest tickets", body: "Per org, not per seat. No per-scan tax. No velvet-rope gates on things that should be standard. Pricing reads like a set list, not a tax form." },
];

const MILESTONES = [
  { date: "2026 Q1", title: "Three rooms on one Atlas", body: "ATLVS, GVTEWAY, and COMPVSS on one backbone — office, door, floor." },
  { date: "2025 Q4", title: "KBYG door passes", body: "One Know-Before-You-Go, authored once, rendered per-persona across portal and floor PWA." },
  { date: "2025 Q3", title: "Proposals signed live", body: "Scroll storytelling, live pricing, e-sign in place. One URL replaces the PDF email thread." },
  { date: "2025 Q2", title: "Vendor payouts + advancing", body: "Live vendor payouts. Sixteen typed deliverables with history, comments, attachments." },
  { date: "2025 Q1", title: "First night shipped", body: "Staffed + scanned a two-thousand-cap room end-to-end on the Atlas. Stage dried. System didn&apos;t." },
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
        <div className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--org-primary)]">The Studio</div>
        <h1 className="mt-3 text-5xl font-semibold tracking-tight sm:text-6xl">Written by the People Who Book the Rooms.</h1>
        <p className="mt-5 max-w-2xl text-lg text-[var(--text-secondary)]">
          Second Star Technologies is the studio behind ATLVS, GVTEWAY, and COMPVSS. The Atlas is a decade of producer instinct — distilled. Every module started as something we were tired of building twice.
        </p>
        <p className="mt-4 max-w-2xl text-sm text-[var(--text-secondary)]">
          One manifest. Three rooms. Private by architecture. Written for producers — by producers.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">The Credo</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {PRINCIPLES.map(({ icon: Icon, title, body }) => (
            <div key={title} className="surface-raised p-6">
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
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">The Tour So Far</h2>
        <ul className="mt-8 space-y-6">
          {MILESTONES.map((m) => (
            <li key={m.date} className="surface-raised grid gap-2 p-6 md:grid-cols-[140px_1fr] md:items-start md:gap-6">
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
        <div className="surface-raised p-10">
          <h2 className="text-3xl font-semibold tracking-tight">Who Runs the Room</h2>
          <p className="mt-4 max-w-2xl text-sm text-[var(--text-secondary)]">
            Second Star is a production + technology studio. We&apos;ve staffed residencies, touring runs, private launches, gallery programs, and activations — and we&apos;ve shipped software for every one of them. The Atlas is a decade of in-the-field instinct compressed into one road case: ATLVS, GVTEWAY, COMPVSS.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 text-sm">
            <Link className="underline underline-offset-4" href="/careers">Join the studio</Link>
            <span className="text-[var(--text-muted)]">·</span>
            <Link className="underline underline-offset-4" href="/contact">Call the studio</Link>
            <span className="text-[var(--text-muted)]">·</span>
            <a className="underline underline-offset-4" href="https://github.com/ghxstship" target="_blank" rel="noreferrer">
              GitHub
            </a>
          </div>
        </div>
      </section>

      <CTASection title="Get on the List." subtitle="GA is free, forever. The soundcheck unlocks the rest." />
    </div>
  );
}
