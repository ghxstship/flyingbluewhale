import Link from "next/link";
import type { Metadata } from "next";
import { CheckCircle2, Command, Database, FileSignature, DollarSign, ClipboardList, Users, Brain, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Breadcrumbs } from "@/components/marketing/Breadcrumb";
import { JsonLd } from "@/components/marketing/JsonLd";
import { FAQSection } from "@/components/marketing/FAQ";
import { FeatureGrid } from "@/components/marketing/FeatureGrid";
import { CTASection } from "@/components/marketing/CTASection";
import { buildMetadata, breadcrumbSchema, productSchema } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "ATLVS — the internal operations console for production teams",
  description:
    "ATLVS is the internal operations console inside flyingbluewhale. Projects, finance, procurement, production, people, AI — one sidebar, role-gated by tier, with an audit log on every mutation. 60+ modules across 9 domains. Built on Next.js and Supabase.",
  path: "/solutions/atlvs",
  keywords: ["ATLVS", "production operations console", "event production dashboard", "internal production platform", "operations console software"],
  ogImageEyebrow: "ATLVS",
  ogImageTitle: "The operations console for production teams",
});

export default function ATLVSPage() {
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Solutions", path: "/solutions" },
    { name: "ATLVS", path: "/solutions/atlvs" },
  ];

  return (
    <div data-platform="atlvs">
      <JsonLd
        data={[
          breadcrumbSchema(crumbs),
          productSchema({
            name: "ATLVS — Internal Operations Console",
            description: "Production operations console with projects, finance, procurement, production, people, and AI modules.",
            url: "https://flyingbluewhale.app/solutions/atlvs",
            price: "0",
          }),
        ]}
      />
      <Breadcrumbs crumbs={crumbs} />

      <section className="mx-auto max-w-6xl px-6 pt-8 pb-12">
        <div className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--org-primary)]">ATLVS · Internal console</div>
        <h1 className="mt-3 text-5xl font-semibold tracking-tight sm:text-6xl">The operations console</h1>
        <p className="mt-5 max-w-2xl text-lg text-[var(--text-secondary)]">
          Your team runs the show here. Projects, finance, procurement, production, people, and AI — one left
          sidebar, one consistent pattern, and tier-based role gating on every module.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button href="/signup">Start free</Button>
          <Button href="/contact" variant="secondary">Book a demo</Button>
          <Link href="/pricing" className="btn btn-ghost">Pricing →</Link>
        </div>
      </section>

      {/* Nine domain modules */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">Nine domains · 60+ modules</div>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          Every production workflow, in one console.
        </h2>
        <div className="mt-8">
          <FeatureGrid
            cols={3}
            features={[
              { icon: Command, title: "Work", body: "Projects, tasks, Gantt, schedule (RRULE + ICS), events, canonical locations." },
              { icon: FileSignature, title: "Sales", body: "Pipeline, leads, clients, interactive proposals with 23 block types + e-sign." },
              { icon: DollarSign, title: "Finance", body: "Invoices, expenses, budgets (with utilization), time, mileage, advances, payouts, live P&L." },
              { icon: ClipboardList, title: "Procurement", body: "Requisitions, POs, vendors, catalog, COI / W-9 tracking, Stripe Connect payouts." },
              { icon: Database, title: "Production", body: "Equipment inventory, rentals with availability, fabrication orders, dispatch, logistics." },
              { icon: Users, title: "People", body: "Directory, crew roster, credentials with expiry alerts, role matrix, invites." },
              { icon: Brain, title: "AI", body: "Streaming Claude assistant, drafting templates, automations, managed agents." },
              { icon: ShieldCheck, title: "Settings", body: "Organization, billing, integrations, API keys, webhooks, audit, compliance, branding." },
              { icon: CheckCircle2, title: "Collaboration", body: "Inbox, files, forms, command palette." },
            ]}
          />
        </div>
      </section>

      {/* Architecture */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="surface-raised grid gap-10 p-10 md:grid-cols-2 md:items-start">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--org-primary)]">Architecture</div>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">Built like a platform, not a template.</h2>
            <p className="mt-4 text-sm text-[var(--text-secondary)]">
              Every module in ATLVS follows the same pattern — list, detail, create, with a status machine where it
              matters (invoices, proposals, POs, tasks). Server actions for mutations, Zod validation at the API
              boundary, and Postgres RLS as the final authority on who-sees-what.
            </p>
            <p className="mt-3 text-sm text-[var(--text-secondary)]">
              That uniformity is why new modules ship in days, not months — and why your team learns the console
              once, not nine times.
            </p>
          </div>
          <ul className="space-y-3 text-sm">
            {[
              "Next.js 16 App Router + React 19 with React Compiler",
              "Supabase Postgres + RLS on every table",
              "10 platform roles × 4 project roles × 4 tiers",
              "Audit log on every mutation (before + after JSONB)",
              "Server actions + Zod at the boundary",
              "Streaming AI assistant (Claude Sonnet 4.6 default)",
              "Stripe Connect for vendor payouts",
              "Sentry + Resend gated by env (production-ready)",
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
        <h2 className="text-3xl font-semibold tracking-tight">Who works in ATLVS?</h2>
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {[
            { role: "Owner / Admin", body: "Full access — billing, org settings, members, integrations. Runs the business." },
            { role: "Controller", body: "Finance + procurement lead. Owns invoices, expenses, budgets, POs, payouts, audit." },
            { role: "Project manager", body: "Collaborator tier — projects, tasks, crew, proposals, clients. Daily driver." },
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
            q: "What does ATLVS stand for?",
            a: "ATLVS is the codename for flyingbluewhale's internal operations console — the red-branded shell where your team works. Every module runs inside it, including finance, procurement, AI, and proposals.",
          },
          {
            q: "How does role-gating work?",
            a: "ATLVS uses 10 platform roles (owner, admin, controller, collaborator, contractor, crew, client, viewer, community, developer) and 4 tiers (portal, starter, professional, enterprise). The `can()` helper gates every capability; RLS policies on Postgres enforce the same gates at the database.",
          },
          {
            q: "Does ATLVS support SSO?",
            a: "SSO (SAML + OIDC) and SCIM provisioning are Enterprise-tier features, backed by Supabase auth. Contact sales to enable.",
          },
          {
            q: "Can I customize the sidebar?",
            a: "The sidebar is driven by a single source of truth (src/lib/nav.ts#platformNav). Self-serve customization via Settings → Branding lands with Enterprise; for now, file a PR.",
          },
          {
            q: "What AI models does the assistant use?",
            a: "Anthropic Claude — Sonnet 4.6 by default, Opus 4.7 available on Professional+. Conversations stream into your workspace and persist to Postgres for audit.",
          },
        ]}
      />

      <CTASection title="Open the console" subtitle="Free forever up to 3 users." />
    </div>
  );
}
