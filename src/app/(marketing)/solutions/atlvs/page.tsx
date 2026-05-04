// ISR — regenerate static HTML every 5 min.
export const revalidate = 300;

import Link from "next/link";
import type { Metadata } from "next";
import {
  CheckCircle2,
  Command,
  Database,
  FileSignature,
  DollarSign,
  ClipboardList,
  Users,
  Brain,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { JsonLd } from "@/components/marketing/JsonLd";
import { FAQSection } from "@/components/marketing/FAQ";
import { FeatureGrid } from "@/components/marketing/FeatureGrid";
import { CTASection } from "@/components/marketing/CTASection";
import { buildMetadata, productSchema } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "ATLVS — The Console",
  description:
    "Where the production lives. RFIs, submittals, daily logs, punch, advancing, finance, procurement, AI. Pitch through wrap. One sidebar.",
  path: "/solutions/atlvs",
  keywords: ["ATLVS", "production operations console", "event production dashboard", "internal production platform"],
  ogImageEyebrow: "ATLVS",
  ogImageTitle: "Where the Production Lives",
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
        data={[
          productSchema({
            name: "ATLVS — The Console",
            description:
              "The office console for production teams. Projects, finance, procurement, advancing, AI — one workspace, one schema.",
            url: "https://flyingbluewhale.app/solutions/atlvs",
            price: "0",
          }),
        ]}
      />
      <Breadcrumbs items={crumbs} className="mx-auto max-w-6xl px-6 pt-6" />

      <section className="mx-auto max-w-6xl px-6 pt-8 pb-12">
        <div className="text-xs font-semibold tracking-[0.25em] text-[var(--org-primary)] uppercase">
          ATLVS · The Console
        </div>
        <h1 className="mt-3 text-5xl font-semibold tracking-tight sm:text-6xl">Where the Production Lives.</h1>
        <p className="mt-5 max-w-2xl text-lg text-[var(--text-secondary)]">
          Pitch to wrap, in one sidebar. RFIs, submittals, daily logs, punch, advancing, finance, procurement, AI.
          Forty-seven modules on one schema.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button href="/signup">Open the Console</Button>
          <Button href="/contact" variant="secondary">
            Talk to the Studio
          </Button>
          <Link href="/pricing" className="btn btn-ghost">
            Pricing →
          </Link>
        </div>
      </section>

      {/* Modules */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="text-[11px] font-semibold tracking-[0.2em] text-[var(--text-muted)] uppercase">
          Nine domains · forty-seven modules
        </div>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Pitch Through Wrap. Same Console.</h2>
        <div className="mt-8">
          <FeatureGrid
            cols={3}
            features={[
              {
                icon: Command,
                title: "Work",
                body: "Projects, tasks, Gantt, schedule, ROS, events, locations. The run-sheet.",
              },
              {
                icon: FileSignature,
                title: "Sales",
                body: "Pipeline, leads, clients, proposals signed in place. 23 block types, e-sig in the page.",
              },
              {
                icon: DollarSign,
                title: "Finance",
                body: "Invoices, expenses, budgets with utilization, time, mileage, advances, payouts, live P&L.",
              },
              {
                icon: ClipboardList,
                title: "Procurement",
                body: "Reqs, RFQs, POs, vendor scorecards, COIs, W-9s, work order broadcasts.",
              },
              {
                icon: Database,
                title: "Production",
                body: "Equipment, rentals with availability, fab orders, dispatch, logistics, site plans.",
              },
              {
                icon: Users,
                title: "People",
                body: "Directory, crew, credentials with expiry alerts, roles, call sheets, time tracking.",
              },
              {
                icon: ClipboardList,
                title: "Construction",
                body: "RFIs, submittals, daily logs, punch list, inspections (10 categories), change orders, payment apps.",
              },
              {
                icon: ShieldCheck,
                title: "Safety",
                body: "Incidents, OSHA, medical, crisis comms, BC/DR, cyber-IR, safeguarding, environmental, playbooks.",
              },
              {
                icon: Brain,
                title: "AI assistant",
                body: "Drafts riders, RFPs, recaps, call sheets from your workspace. Never the public web.",
              },
            ]}
          />
        </div>
      </section>

      {/* Architecture */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="surface grid gap-10 p-10 md:grid-cols-2 md:items-start">
          <div>
            <div className="text-[11px] font-semibold tracking-[0.2em] text-[var(--org-primary)] uppercase">
              Under the hood
            </div>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">Same Rails. Every Module.</h2>
            <p className="mt-4 text-sm text-[var(--text-secondary)]">
              List, detail, create, edit. Every module rides the same rails — with status flow where it counts
              (invoices, proposals, POs, tasks, RFIs). Validation at the door. Tenant walled at the database.
            </p>
            <p className="mt-3 text-sm text-[var(--text-secondary)]">
              Same rails mean the team learns the console once. New modules ship in days. The work changes — the
              workflow holds.
            </p>
          </div>
          <ul className="space-y-3 text-sm">
            {[
              "RLS at the database. Tenant walled in Postgres.",
              "Role-aware on every action. Enforced server-side, not in the UI.",
              "Immutable audit log. Actor, IP, before, after. Forever.",
              "AI grounded in your workspace. Never the public internet.",
              "Stripe Connect vendor payouts. Money never crosses our books.",
              "Signed webhooks (HMAC-SHA256) on every state change.",
              "Self-expiring file shares. No public buckets.",
              "99.9% uptime SLA on Festival.",
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
        <h2 className="text-3xl font-semibold tracking-tight">Who Lives Here.</h2>
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {[
            {
              role: "Owner / Admin",
              body: "Full access. Billing, org, members, integrations, branding. Runs the business while the show runs.",
            },
            {
              role: "Controller",
              body: "Finance + procurement. Invoices, expenses, budgets, POs, payouts, audit log.",
            },
            {
              role: "Project manager",
              body: "Daily driver. Projects, tasks, schedule, RFIs, submittals, advancing, crew, proposals, clients.",
            },
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
            a: "The console. Red-branded, desk-bound, always on. Forty-seven modules — proposals, RFIs, submittals, daily logs, punch, inspections, advancing, finance, procurement, AI. Where the production lives.",
          },
          {
            q: "How does role-aware access work?",
            a: "Ten roles (owner, admin, controller, collaborator, contractor, crew, client, viewer, and cameos). Every capability is gated by role — enforced at the database via RLS, not in the UI.",
          },
          {
            q: "Can I brand it?",
            a: "Self-serve brand skins under Settings → Branding land on Festival. Production gets logo + accent. Every tier respects your org's accent color in the chrome.",
          },
          {
            q: "What AI is included?",
            a: "Anthropic Claude under the hood. A fast model for daily drafting on Production. Deep-reasoning model on Festival. Every thread logs to your workspace, scoped tight.",
          },
        ]}
      />

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
