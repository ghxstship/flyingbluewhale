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
  title: "ATLVS — the office console for production teams",
  description:
    "ATLVS is the office console from Second Star Technologies. Projects, finance, procurement, production, people, AI — one sidebar, role-aware access, and an immutable audit log. Sixty-plus modules across nine domains.",
  path: "/solutions/atlvs",
  keywords: ["ATLVS", "production operations console", "event production dashboard", "internal production platform", "operations console software"],
  ogImageEyebrow: "ATLVS",
  ogImageTitle: "The operations console for production teams",
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
        <div className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--org-primary)]">ATLVS · Office console</div>
        <h1 className="mt-3 text-5xl font-semibold tracking-tight sm:text-6xl">Run the Office.</h1>
        <p className="mt-5 max-w-2xl text-lg text-[var(--text-secondary)]">
          Your team's command center. Projects, finance, procurement, production, people, and AI —
          one sidebar, one consistent workflow, role-aware access on every module.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button href="/signup">Start free</Button>
          <Button href="/contact" variant="secondary">Book a demo</Button>
          <Link href="/pricing" className="btn btn-ghost">Pricing →</Link>
        </div>
      </section>

      {/* Nine domain modules */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">Nine domains · Sixty-plus modules</div>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          Every Production Workflow. In One Console.
        </h2>
        <div className="mt-8">
          <FeatureGrid
            cols={3}
            features={[
              { icon: Command, title: "Work", body: "Projects, tasks, Gantt, schedule, events, and canonical locations." },
              { icon: FileSignature, title: "Sales", body: "Pipeline, leads, clients, and interactive proposals signed in place." },
              { icon: DollarSign, title: "Finance", body: "Invoices, expenses, budgets with utilization, time, mileage, advances, payouts, and live P&L." },
              { icon: ClipboardList, title: "Procurement", body: "Requisitions, POs, vendors, catalog, COI and W-9 tracking, direct vendor payouts." },
              { icon: Database, title: "Production", body: "Equipment inventory, rentals with availability, fabrication orders, dispatch, and logistics." },
              { icon: Users, title: "People", body: "Directory, crew roster, credentials with expiry alerts, role matrix, and invites." },
              { icon: Brain, title: "AI", body: "An assistant that drafts from your data — plus templates and automations for the busywork." },
              { icon: ShieldCheck, title: "Settings", body: "Organization, billing, integrations, webhooks, audit, compliance, and branding." },
              { icon: CheckCircle2, title: "Collaboration", body: "Inbox, files, forms, and the command palette." },
            ]}
          />
        </div>
      </section>

      {/* Architecture */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="surface-raised grid gap-10 p-10 md:grid-cols-2 md:items-start">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--org-primary)]">How it's built</div>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">Built Like a Platform. Not a Template.</h2>
            <p className="mt-4 text-sm text-[var(--text-secondary)]">
              Every module follows the same pattern — list, detail, create — with clean status flow where it
              matters (invoices, proposals, POs, tasks). Validation at the boundary. Your org's data walled off
              at the data layer.
            </p>
            <p className="mt-3 text-sm text-[var(--text-secondary)]">
              That consistency is why new modules ship in days, not months — and why your team learns the
              console once, not nine times.
            </p>
          </div>
          <ul className="space-y-3 text-sm">
            {[
              "Every tool a production team needs — office, stakeholders, field",
              "Your data walled off per organization — enforced at the database",
              "Role-aware access across every tier and every module",
              "Immutable audit log — who, when, what changed, what it was before",
              "AI grounded in your projects, crew, and budgets — not the public internet",
              "Direct vendor payouts — ACH, card, or international wire",
              "99.9% uptime SLA on Enterprise",
              "SSO, SCIM, and signed DPA available",
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
        <h2 className="text-3xl font-semibold tracking-tight">Who Works in ATLVS?</h2>
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {[
            { role: "Owner / Admin", body: "Full access — billing, org settings, members, integrations. Runs the business." },
            { role: "Controller", body: "Finance and procurement lead. Owns invoices, expenses, budgets, POs, payouts, and audit." },
            { role: "Project manager", body: "Daily driver — projects, tasks, crew, proposals, clients." },
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
            a: "ATLVS is the office console from Second Star Technologies — the red-branded app where your team works. Every office module lives here: projects, finance, procurement, production, people, AI, proposals.",
          },
          {
            q: "How does role-based access work?",
            a: "Ten platform roles (owner, admin, controller, collaborator, contractor, crew, client, viewer, and more) across four tiers. Every capability is gated by role, and the same gates are enforced at the data layer — not just in the app.",
          },
          {
            q: "Does ATLVS support SSO?",
            a: "Yes. SSO (SAML and OIDC) and SCIM provisioning are Enterprise-tier features. Contact sales to enable.",
          },
          {
            q: "Can I customize the sidebar?",
            a: "The sidebar is consistent across every workspace today. Self-serve customization via Settings → Branding lands with Enterprise.",
          },
          {
            q: "What AI powers the assistant?",
            a: "A fast model by default for day-to-day work, with a deep-reasoning model available on Professional and up. Every conversation is scoped to your workspace and logged for audit.",
          },
        ]}
      />

      <CTASection title="Open the console" subtitle="Free forever up to 3 users." />
    </div>
  );
}
