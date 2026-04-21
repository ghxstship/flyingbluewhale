import type { Metadata } from "next";
import Link from "next/link";
import { Compass, Layers, Rocket, ShieldCheck } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { JsonLd } from "@/components/marketing/JsonLd";
import { CTASection } from "@/components/marketing/CTASection";
import { buildMetadata, organizationSchema } from "@/lib/seo";
export const metadata: Metadata = buildMetadata({
  title: "About Second Star Technologies — built by operators, for operators",
  description:
    "Second Star Technologies is the company behind ATLVS, GVTEWAY, and COMPVSS — a unified production platform. Three shells, one schema, one identity, one set of RLS rules. Built for event production teams who are tired of duct tape.",
  path: "/about",
  keywords: ["Second Star Technologies about", "ATLVS", "GVTEWAY", "COMPVSS", "event production platform", "production software company"],
  ogImageEyebrow: "About",
  ogImageTitle: "Built by operators, for operators.",
});

const PRINCIPLES = [
  { icon: Layers, title: "One schema, many shells", body: "ATLVS, GVTEWAY, COMPVSS share identity, RLS, and design tokens. No duct tape between apps — because there's only one app." },
  { icon: ShieldCheck, title: "Security is not a feature", body: "RLS on every table. Audit log for every mutation. HMAC on every webhook. These are not enterprise upsells." },
  { icon: Rocket, title: "Ship what we use", body: "We dogfood. Every major release runs on a real production we're staffing that weekend before it ships to you." },
  { icon: Compass, title: "Honest pricing", body: "Per org, not per seat. No per-scan surcharges. No fake 'enterprise' gates on features that should be standard." },
];

const MILESTONES = [
  { date: "2026 Q1", title: "Three-shell topology shipped", body: "ATLVS + GVTEWAY + COMPVSS live on a unified schema. 33+ tables, full RLS, streaming AI." },
  { date: "2025 Q4", title: "Boarding Pass pattern integrated", body: "Role-scoped KBYG event guides, authored once in ATLVS CMS, rendered across portal + mobile." },
  { date: "2025 Q3", title: "Interactive proposals", body: "Synthesized best practices from F1-Miami scroll storytelling and proposalzero structured pricing." },
  { date: "2025 Q2", title: "Stripe Connect + advancing", body: "Vendor payouts via Connect Express. 16 typed deliverables with history, comments, attachments." },
  { date: "2025 Q1", title: "First show shipped", body: "Staffed and scanned our first 2,000-cap festival end-to-end on the Second Star Technologies platform." },
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
        <div className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--org-primary)]">About</div>
        <h1 className="mt-3 text-5xl font-semibold tracking-tight sm:text-6xl">Built by Operators, for Operators.</h1>
        <p className="mt-5 max-w-2xl text-lg text-[var(--text-secondary)]">
          Second Star Technologies is the production operating system behind ATLVS, GVTEWAY, and COMPVSS. We built it
          because every production team we worked with was duct-taping a dozen SaaS tools together — Asana for tasks,
          Notion for wiki, Google Sheets for budgets, DocuSign for proposals, Eventbrite for tickets, a clipboard for
          the gate — and losing money in the seams.
        </p>
        <p className="mt-4 max-w-2xl text-sm text-[var(--text-secondary)]">
          One platform. Three shells. Everyone on the same page — from proposal to wrap.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">What We Believe.</h2>
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
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">How We Got Here.</h2>
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
          <h2 className="text-3xl font-semibold tracking-tight">Who We Are.</h2>
          <p className="mt-4 max-w-2xl text-sm text-[var(--text-secondary)]">
            Second Star Technologies is a production + technology studio. We've staffed festivals, corporate
            activations, private events, and artist tours — and we've built software for every one of them. The
            platform is the consolidation of a decade of in-the-field duct tape into a single suite: ATLVS, GVTEWAY,
            and COMPVSS.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 text-sm">
            <Link className="underline underline-offset-4" href="/careers">Careers</Link>
            <span className="text-[var(--text-muted)]">·</span>
            <Link className="underline underline-offset-4" href="/contact">Contact sales</Link>
            <span className="text-[var(--text-muted)]">·</span>
            <a className="underline underline-offset-4" href="https://github.com/ghxstship" target="_blank" rel="noreferrer">
              GitHub
            </a>
          </div>
        </div>
      </section>

      <CTASection title="Try the platform" subtitle="Free for Life on the Access tier. 14-day trial of everything else." />
    </div>
  );
}
