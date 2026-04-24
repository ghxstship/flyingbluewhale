// ISR (H2-08 / IK-030) — regenerate static HTML every 5 min.
// Shortens to 60s if editorial cadence picks up; `revalidate` alone is enough,
// no `dynamic = 'force-static'` because some pages read query params.
export const revalidate = 300;

import Link from "next/link";
import type { Metadata } from "next";
import { CheckCircle2, Command, Database, FileSignature, DollarSign, ClipboardList, Users, Brain, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { JsonLd } from "@/components/marketing/JsonLd";
import { FAQSection } from "@/components/marketing/FAQ";
import { FeatureGrid } from "@/components/marketing/FeatureGrid";
import { CTASection } from "@/components/marketing/CTASection";
import { buildMetadata, productSchema } from "@/lib/seo";
export const metadata: Metadata = buildMetadata({
  title: "ATLVS — the production office. In one sidebar.",
  description:
    "ATLVS is the office that runs the show — M-F, load-in to load-out. Nine domains, 60+ modules, one sidebar, role-aware everywhere. Proposals to payouts, POs to ceremonies.",
  path: "/solutions/atlvs",
  keywords: ["ATLVS", "production operations console", "event production dashboard", "internal production platform", "operations console software"],
  ogImageEyebrow: "ATLVS",
  ogImageTitle: "The production office — in one sidebar",
});

export default function ATLVSPage() {
  const crumbs = [
    { label: "Home", href: "/" },
    { label: "Solutions", href: "/solutions" },
    { label: "ATLVS", href: "/solutions/atlvs" },
  ];

  return (
    <div data-platform="atlvs">
      <JsonLd
        data={[productSchema({
            name: "ATLVS — Office Operations Console",
            description: "The office console for production teams. Projects, finance, procurement, production, people, and AI — in one connected workspace.",
            url: "https://flyingbluewhale.app/solutions/atlvs",
            price: "0",
          }),
        ]}
      />
      <Breadcrumbs items={crumbs} className="mx-auto max-w-6xl px-6 pt-6" />

      <section className="mx-auto max-w-6xl px-6 pt-8 pb-12">
        <div className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--org-primary)]">ATLVS · the office</div>
        <h1 className="mt-3 text-5xl font-semibold tracking-tight sm:text-6xl">Runs the Show From the Desk.</h1>
        <p className="mt-5 max-w-2xl text-lg text-[var(--text-secondary)]">
          Your production office, load-in to load-out. Nine domains, 60+ modules, one sidebar. Proposals to payouts, POs to ceremonies, crew to cash. Role-aware on every act of every module.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button href="/signup">Doors open</Button>
          <Button href="/contact" variant="secondary">Backstage walkthrough</Button>
          <Link href="/pricing" className="btn btn-ghost">Tickets →</Link>
        </div>
      </section>

      {/* Nine domain modules */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">Nine domains · Sixty-plus modules</div>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          Every Act of Every Show. Same Sidebar.
        </h2>
        <div className="mt-8">
          <FeatureGrid
            cols={3}
            features={[
              { icon: Command, title: "Work", body: "Projects, tasks, Gantt, schedule, events, canonical locations. The run-sheet." },
              { icon: FileSignature, title: "Sales", body: "Pipeline, leads, clients, proposals that get signed in the app — not the inbox." },
              { icon: DollarSign, title: "Finance", body: "Invoices, expenses, budgets with utilization, time, mileage, advances, payouts, live P&L." },
              { icon: ClipboardList, title: "Procurement", body: "Reqs, POs, vendors, catalog, COI + W-9 tracking, direct vendor payouts." },
              { icon: Database, title: "Production", body: "Equipment, rentals with availability, fab orders, dispatch, logistics. The road case." },
              { icon: Users, title: "People", body: "Directory, crew, credentials with expiry alerts, role matrix, invites." },
              { icon: Brain, title: "AI runner", body: "Drafts from your manifest — riders, RFPs, recaps. Templates + automations for the busywork." },
              { icon: ShieldCheck, title: "Settings", body: "Org, billing, integrations, webhooks, audit, compliance, branding." },
              { icon: CheckCircle2, title: "Collab", body: "Inbox, files, forms, command palette. No third-party chat tax." },
            ]}
          />
        </div>
      </section>

      {/* Architecture */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="surface-raised grid gap-10 p-10 md:grid-cols-2 md:items-start">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--org-primary)]">Under the hood</div>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">A Real Main Stage. Not a Folding Table.</h2>
            <p className="mt-4 text-sm text-[var(--text-secondary)]">
              Every module rides the same rails — list, detail, create — with status flow where it counts (invoices, proposals, POs, tasks). Validation at the door. Your manifest walled off at the database layer, not in the pitch deck.
            </p>
            <p className="mt-3 text-sm text-[var(--text-secondary)]">
              Same rails mean your team learns the console once. New modules ship in days, not quarters. The act changes — the stage crew stays.
            </p>
          </div>
          <ul className="space-y-3 text-sm">
            {[
              "Every tool the show needs — office, door, floor",
              "Your manifest walled off per org — enforced in the database",
              "Role-aware on every act of every module",
              "Immutable audit log — who, when, before, after. Forever.",
              "AI grounded in your lineup — not the public internet",
              "Direct vendor payouts — ACH, card, international wire",
              "99.9% uptime SLA on Festival tier",
              "Signed DPA available on Festival tier",
            ].map((x) => (
              <li key={x} className="flex items-start gap-2">
                <CheckCircle2 size={16} className="mt-0.5 text-[var(--org-primary)]" />
                <span>{x}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Persona tiles */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="text-3xl font-semibold tracking-tight">Who Lives in ATLVS?</h2>
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {[
            { role: "Owner / Admin", body: "Full house pass — billing, org, members, integrations. Runs the business while the show runs itself." },
            { role: "Controller", body: "Finance + procurement on the board. Invoices, expenses, budgets, POs, payouts, audit." },
            { role: "Project manager", body: "Daily driver — projects, tasks, crew, proposals, clients. The tour manager's tour manager." },
          ].map((p) => (
            <div key={p.role} className="surface p-5">
              <div className="text-sm font-semibold">{p.role}</div>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      <FAQSection
        title="ATLVS · FAQ"
        faqs={[
          {
            q: "What is ATLVS?",
            a: "The production office. Red branded, desk-bound, always on. Proposals, finance, procurement, production, people, AI — the desk job that runs the show.",
          },
          {
            q: "How does role-based access work?",
            a: "Ten roles across four tiers (owner, admin, controller, collaborator, contractor, crew, client, viewer, and cameos). Every capability is gated by role — and the gate is enforced in the database, not the UI.",
          },
          {
            q: "Can I re-skin the sidebar?",
            a: "Consistent today — everyone ships on the same rails. Self-serve brand skins under Settings → Branding land on Festival tier.",
          },
          {
            q: "What AI is on the bill?",
            a: "A fast runner model for daily hits, with a deep-reasoning co-headliner on All-Access and up. Every thread logs to your workspace, scoped tight.",
          },
        ]}
      />

      <CTASection title="Open the House." subtitle="Free forever on GA. Three seats in the production office, on us." />
    </div>
  );
}
