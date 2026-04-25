import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase, env } from "@/lib/env";
import { money } from "@/components/detail/DetailShell";
import { OpenPortalButton } from "./OpenPortalButton";

const TIERS = [
  { tier: "access", price: "Free", features: ["Basic project + ticketing", "Up to 3 users", "Community support"] },
  { tier: "core", price: "$49/mo", features: ["Invoicing, expenses, tasks", "Up to 10 users", "Email support"] },
  { tier: "professional", price: "$199/mo", features: ["Full finance, procurement, AI", "Unlimited users", "Priority support"] },
  { tier: "enterprise", price: "Contact sales", features: ["SSO, SCIM, audit", "Custom integrations", "Dedicated CSM"] },
];

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader title="Billing" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const { data: org } = await supabase
    .from("orgs")
    .select("tier, stripe_customer_id")
    .eq("id", session.orgId)
    .maybeSingle();
  const current = (org?.tier as string | undefined) ?? "access";
  const stripeConfigured = Boolean(env.STRIPE_SECRET_KEY);

  // Recent invoices — bridges to the canonical /finance/invoices list.
  const { data: invoiceRows } = await supabase
    .from("invoices")
    .select("id, number, status, amount_cents, currency, issued_at, due_at")
    .eq("org_id", session.orgId)
    .order("issued_at", { ascending: false })
    .limit(5);
  const invoices = invoiceRows ?? [];

  return (
    <>
      <ModuleHeader
        eyebrow="Settings"
        title="Workspace settings"
        subtitle="Billing"
      />
      <div className="page-content space-y-5">
        {!stripeConfigured && (
          <Alert kind="warning">
            <span className="font-medium">Stripe is not configured.</span> Set
            <code className="font-mono">STRIPE_SECRET_KEY</code> in env to enable
            customer-portal access for plan + payment-method management.
          </Alert>
        )}

        <section className="surface p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">Plan</div>
              <div className="mt-1 text-base font-semibold capitalize">{current}</div>
            </div>
            <OpenPortalButton disabled={!stripeConfigured} />
          </div>
        </section>

        <section>
          <h2 className="mb-2 text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">Plans</h2>
          <div className="grid gap-3 md:grid-cols-4">
            {TIERS.map((t) => (
              <div
                key={t.tier}
                className={`surface p-5 ${t.tier === current ? "ring-2 ring-[var(--org-primary)]" : ""}`}
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold capitalize">{t.tier}</div>
                  {t.tier === current && <Badge variant="brand">Current</Badge>}
                </div>
                <div className="mt-2 text-lg font-semibold tracking-tight">{t.price}</div>
                <ul className="mt-3 space-y-1 text-xs text-[var(--text-secondary)]">
                  {t.features.map((f) => <li key={f}>· {f}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">
              Recent invoices
            </h2>
            <Link href="/console/finance/invoices" className="text-xs text-[var(--org-primary)] hover:underline">
              View all →
            </Link>
          </div>
          <div className="surface overflow-x-auto">
            <table className="data-table w-full text-sm">
              <thead>
                <tr>
                  <th>Number</th>
                  <th>Status</th>
                  <th>Amount</th>
                  <th>Issued</th>
                  <th>Due</th>
                </tr>
              </thead>
              <tbody>
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-[var(--text-muted)]">
                      No invoices yet.
                    </td>
                  </tr>
                ) : (
                  invoices.map((i) => (
                    <tr key={i.id}>
                      <td>
                        <Link href={`/console/finance/invoices/${i.id}`} className="font-mono text-xs hover:underline">
                          {i.number}
                        </Link>
                      </td>
                      <td><Badge variant="muted">{i.status}</Badge></td>
                      <td className="font-mono text-xs">{money(i.amount_cents)}</td>
                      <td className="font-mono text-xs">
                        {i.issued_at ? new Date(i.issued_at).toLocaleDateString() : "—"}
                      </td>
                      <td className="font-mono text-xs">
                        {i.due_at ? new Date(i.due_at).toLocaleDateString() : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  );
}
