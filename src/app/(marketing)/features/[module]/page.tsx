import Link from "next/link";

const MODULES: Record<string, { title: string; blurb: string }> = {
  console: { title: "Platform console", blurb: "Projects, finance, procurement, production, people, AI — all role-gated by tier." },
  portals: { title: "Stakeholder portals", blurb: "Slug-scoped workspaces for artists, vendors, clients, sponsors, guests, crew." },
  mobile: { title: "Mobile PWA", blurb: "Offline ticket scan, clock in/out, inventory scan, incident reports." },
  ai: { title: "AI tooling", blurb: "Streaming Claude assistant, drafting templates, and managed agents." },
  finance: { title: "Finance", blurb: "Invoices, expenses, budgets, time, mileage, advances, live P&L." },
  procurement: { title: "Procurement", blurb: "Requisitions, POs, vendor COIs/W-9s, Stripe Connect payouts." },
  production: { title: "Production", blurb: "Equipment, rentals, fabrication, dispatch, logistics." },
  compliance: { title: "Compliance", blurb: "Per-org RLS, audit log, retention, SSO/SCIM on enterprise." },
};

export default async function FeatureDetail({ params }: { params: Promise<{ module: string }> }) {
  const { module } = await params;
  const info = MODULES[module] ?? { title: module, blurb: "Module detail coming soon." };
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <div className="text-xs font-semibold uppercase tracking-wider text-[var(--org-primary)]">Feature</div>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight">{info.title}</h1>
      <p className="mt-4 text-sm text-[var(--text-secondary)]">{info.blurb}</p>
      <div className="mt-8">
        <Link href="/features" className="text-sm text-[var(--org-primary)]">← All features</Link>
      </div>
    </div>
  );
}
