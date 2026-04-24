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
  title: "ATLVS — The Office",
  description:
    "The production studio, load-in to load-out. Nine rooms, sixty-plus modules, one sidebar. Role-aware on every act. Built by producers for the producers who book the rooms.",
  path: "/solutions/atlvs",
  keywords: ["ATLVS", "production operations console", "event production dashboard", "internal production platform", "operations console software"],
  ogImageEyebrow: "ATLVS",
  ogImageTitle: "The Office · One Sidebar",
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
        <div className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--org-primary)]">ATLVS · The Office</div>
        <h1 className="mt-3 text-5xl font-semibold tracking-tight sm:text-6xl">The Room Runs From the Desk.</h1>
        <p className="mt-5 max-w-2xl text-lg text-[var(--text-secondary)]">
          The production studio, load-in to load-out. Nine rooms, sixty-plus modules, one sidebar. Proposals to payouts, POs to ceremonies, crew to cash. Role-aware on every act.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button href="/signup">Get on the list</Button>
          <Button href="/contact" variant="secondary">Private walkthrough</Button>
          <Link href="/pricing" className="btn btn-ghost">Tickets →</Link>
        </div>
      </section>

      {/* Nine domain modules */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">Nine rooms · Sixty-plus modules</div>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          Every Act of Every Night. Same Sidebar.
        </h2>
        <div className="mt-8">
          <FeatureGrid
            cols={3}
            features={[
              { icon: Command, title: "Work", body: "Projects, tasks, Gantt, schedule, events, canonical locations. The run-sheet." },
              { icon: FileSignature, title: "Sales", body: "Pipeline, leads, clients, proposals signed in place. Not in the inbox." },
              { icon: DollarSign, title: "Finance", body: "Invoices, expenses, budgets with utilization, time, mileage, advances, payouts, live P&L." },
              { icon: ClipboardList, title: "Procurement", body: "Reqs, POs, vendors, catalog, COI + W-9 tracking, live vendor payouts." },
              { icon: Database, title: "Production", body: "Equipment, rentals with availability, fab orders, dispatch, logistics. The road case." },
              { icon: Users, title: "People", body: "Directory, crew, credentials with expiry alerts, role matrix, invites." },
              { icon: Brain, title: "AI runner", body: "Drafts from your manifest — riders, RFPs, recaps. Templates and automations for the busywork." },
              { icon: ShieldCheck, title: "Settings", body: "Org, billing, integrations, webhooks, audit, compliance, branding." },
              { icon: CheckCircle2, title: "Collab", body: "Inbox, files, forms, command palette. Quiet as the back bar." },
            ]}
          />
        </div>
      </section>

      {/* Architecture */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="surface-raised grid gap-10 p-10 md:grid-cols-2 md:items-start">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--org-primary)]">Under the hood</div>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">Built Like a Venue. Not a Template.</h2>
            <p className="mt-4 text-sm text-[var(--text-secondary)]">
              Every module rides the same rails — list, detail, create — with status flow where it counts (invoices, proposals, POs, tasks). Validation at the door. Your manifest walled at the database, private by architecture.
            </p>
            <p className="mt-3 text-sm text-[var(--text-secondary)]">
              Same rails mean your studio learns the console once. New modules ship in days. The act changes — the stage crew stays.
            </p>
          </div>
          <ul className="space-y-3 text-sm">
            {[
              "One manifest, three rooms — office, door, floor",
              "Walled at the database — private by architecture",
              "Role-aware on every act of every module",
              "Immutable audit log — who, when, before, after. Forever.",
              "AI grounded in your manifest — never the public internet",
              "Live vendor payouts — ACH, card, international wire",
              "99.9% uptime SLA on the Festival tier",
              "Signed DPA on the Festival tier",
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
            a: "The production office. Red-branded, desk-bound, always on. Proposals, finance, procurement, production, people, AI. Where the studio lives.",
          },
          {
            q: "How does role-aware access work?",
            a: "Ten roles across four tiers (owner, admin, controller, collaborator, contractor, crew, client, viewer, and cameos). Every capability is gated by role — enforced in the database, not the UI.",
          },
          {
            q: "Can I re-skin the sidebar?",
            a: "Consistent today — everyone ships on the same rails. Self-serve brand skins under Settings → Branding land on the Festival tier.",
          },
          {
            q: "What AI is on the bill?",
            a: "A fast runner model for daily hits, with a deep-reasoning co-headliner on All-Access and up. Every thread logs to your workspace, scoped tight.",
          },
        ]}
      />

      <CTASection title="Walk the Office." subtitle="GA is free, forever. Three seats in the studio, on us." />
    </div>
  );
}
