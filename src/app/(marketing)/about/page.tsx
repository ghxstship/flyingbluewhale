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
  title: "About — Built by Operators. Tested at Doors.",
  description:
    "Second Star Technologies is the crew behind ATLVS, GVTEWAY, and COMPVSS. A decade of gate, rider, invoice, and group-chat duct tape — consolidated into one rig that ships the show.",
  path: "/about",
  keywords: ["Second Star Technologies about", "ATLVS", "GVTEWAY", "COMPVSS", "event production platform", "production software company"],
  ogImageEyebrow: "About",
  ogImageTitle: "Built by operators. Tested at doors.",
});

const PRINCIPLES = [
  { icon: Layers, title: "Three acts, one stage", body: "ATLVS, GVTEWAY, and COMPVSS share identity, data, and design. No duct tape between apps — because it&apos;s one rig." },
  { icon: ShieldCheck, title: "Security isn&apos;t an upsell", body: "Manifest walled off per org. Immutable audit log on every hit. Signed webhooks. Standard on GA, not a Festival-tier promise." },
  { icon: Rocket, title: "We dogfood", body: "Every major release runs on a real show we&apos;re staffing that weekend before it ships to you. If it doesn&apos;t survive the load-in, it doesn&apos;t get the green light." },
  { icon: Compass, title: "Honest ticketing", body: "Per org, not per seat. No per-scan surcharges. No fake Festival-tier gates on things that should be standard. Pricing should read like a set list, not a tax form." },
];

const MILESTONES = [
  { date: "2026 Q1", title: "All three acts on the bill", body: "ATLVS, GVTEWAY, and COMPVSS connected on one backbone — office, door, floor." },
  { date: "2025 Q4", title: "KBYG door passes", body: "One Know-Before-You-Go, authored once, rendered per-persona across portal + PWA." },
  { date: "2025 Q3", title: "Proposals signed live", body: "Scroll storytelling, live pricing, e-sign in place. One URL killed the PDF email thread." },
  { date: "2025 Q2", title: "Vendor payouts + advancing", body: "Live vendor payouts. 16 typed deliverables with history, comments, attachments." },
  { date: "2025 Q1", title: "First show shipped", body: "Staffed + scanned a 2,000-cap festival end-to-end on Second Star. Stage dried. System didn&apos;t." },
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
        <div className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--org-primary)]">About the crew</div>
        <h1 className="mt-3 text-5xl font-semibold tracking-tight sm:text-6xl">Built by Operators. Tested at Doors.</h1>
        <p className="mt-5 max-w-2xl text-lg text-[var(--text-secondary)]">
          Second Star Technologies is the rig behind ATLVS, GVTEWAY, and COMPVSS. We built it because every production team we worked with was duct-taping a dozen tools together — Asana for tasks, a wiki for the docs, spreadsheets for budgets, DocuSign for proposals, a third-party for tickets, a clipboard at the gate, and a group chat named chaos. Money bleeding out at every seam.
        </p>
        <p className="mt-4 max-w-2xl text-sm text-[var(--text-secondary)]">
          One rig. Three acts. Everyone reading the same manifest — from first pitch to final settlement, from load-in to load-out to the plane home.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">What We Believe</h2>
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
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">How the Tour Got Here</h2>
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
          <h2 className="text-3xl font-semibold tracking-tight">Who&apos;s on the Bus</h2>
          <p className="mt-4 max-w-2xl text-sm text-[var(--text-secondary)]">
            Second Star is a production + technology studio. We&apos;ve staffed festivals, corporate activations, residencies, gallery openings, and artist tours — and we&apos;ve shipped software for every one of them. The rig is a decade of in-the-field duct tape compressed into one road case: ATLVS, GVTEWAY, COMPVSS.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 text-sm">
            <Link className="underline underline-offset-4" href="/careers">Join the crew</Link>
            <span className="text-[var(--text-muted)]">·</span>
            <Link className="underline underline-offset-4" href="/contact">Ring the promoter</Link>
            <span className="text-[var(--text-muted)]">·</span>
            <a className="underline underline-offset-4" href="https://github.com/ghxstship" target="_blank" rel="noreferrer">
              GitHub
            </a>
          </div>
        </div>
      </section>

      <CTASection title="Get on the List." subtitle="GA is free, forever. 14-night soundcheck unlocks the rest." />
    </div>
  );
}
