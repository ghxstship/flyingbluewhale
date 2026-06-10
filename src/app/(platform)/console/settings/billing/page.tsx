import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase, env } from "@/lib/env";
import { toTitle } from "@/lib/format";
import { money } from "@/components/detail/DetailShell";
import { getRequestT } from "@/lib/i18n/request";
import { OpenPortalButton } from "./OpenPortalButton";

type TierDef = {
  tier: string;
  priceKey: string;
  priceFallback: string;
  featureKeys: { key: string; fallback: string }[];
};

const TIERS: TierDef[] = [
  {
    tier: "access",
    priceKey: "console.settings.billing.tiers.access.price",
    priceFallback: "Free",
    featureKeys: [
      { key: "console.settings.billing.tiers.access.feature1", fallback: "Basic project + ticketing" },
      { key: "console.settings.billing.tiers.access.feature2", fallback: "Up to 3 users" },
      { key: "console.settings.billing.tiers.access.feature3", fallback: "Community support" },
    ],
  },
  {
    tier: "core",
    priceKey: "console.settings.billing.tiers.core.price",
    priceFallback: "$49/mo",
    featureKeys: [
      { key: "console.settings.billing.tiers.core.feature1", fallback: "Invoicing, expenses, tasks" },
      { key: "console.settings.billing.tiers.core.feature2", fallback: "Up to 10 users" },
      { key: "console.settings.billing.tiers.core.feature3", fallback: "Email support" },
    ],
  },
  {
    tier: "professional",
    priceKey: "console.settings.billing.tiers.professional.price",
    priceFallback: "$199/mo",
    featureKeys: [
      { key: "console.settings.billing.tiers.professional.feature1", fallback: "Full finance, procurement, AI" },
      { key: "console.settings.billing.tiers.professional.feature2", fallback: "Unlimited users" },
      { key: "console.settings.billing.tiers.professional.feature3", fallback: "Priority support" },
    ],
  },
  {
    tier: "enterprise",
    priceKey: "console.settings.billing.tiers.enterprise.price",
    priceFallback: "Contact Sales",
    featureKeys: [
      { key: "console.settings.billing.tiers.enterprise.feature1", fallback: "SSO, SCIM, audit" },
      { key: "console.settings.billing.tiers.enterprise.feature2", fallback: "Custom integrations" },
      { key: "console.settings.billing.tiers.enterprise.feature3", fallback: "Dedicated CSM" },
    ],
  },
];

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader title={t("console.settings.billing.title", undefined, "Billing")} />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.settings.billing.configureSupabase", undefined, "Configure Supabase.")}
          </div>
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
    .select("id, number, invoice_state, amount_cents, currency, issued_at, due_at")
    .eq("org_id", session.orgId)
    .order("issued_at", { ascending: false })
    .limit(5);
  const invoices = invoiceRows ?? [];

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.settings.billing.eyebrow", undefined, "Settings")}
        title={t("console.settings.billing.workspaceTitle", undefined, "Workspace Settings")}
        subtitle={t("console.settings.billing.subtitle", undefined, "Billing")}
      />
      <div className="page-content space-y-5">
        {!stripeConfigured && (
          <Alert kind="warning">
            <span className="font-medium">
              {t("console.settings.billing.stripeNotConfigured", undefined, "Stripe is not configured.")}
            </span>{" "}
            {t("console.settings.billing.stripeNotConfiguredHintBefore", undefined, "Set")}
            <code className="font-mono">STRIPE_SECRET_KEY</code>{" "}
            {t(
              "console.settings.billing.stripeNotConfiguredHintAfter",
              undefined,
              "in env to enable customer-portal access for plan + payment-method management.",
            )}
          </Alert>
        )}

        <section className="surface p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs tracking-[0.18em] text-[var(--p-text-2)] uppercase">
                {t("console.settings.billing.plan", undefined, "Plan")}
              </div>
              <div className="mt-1 text-base font-semibold">{toTitle(current)}</div>
            </div>
            <OpenPortalButton disabled={!stripeConfigured} />
          </div>
        </section>

        <section>
          <h2 className="mb-2 text-xs tracking-[0.18em] text-[var(--p-text-2)] uppercase">
            {t("console.settings.billing.plansHeading", undefined, "Plans")}
          </h2>
          <div className="grid gap-3 md:grid-cols-4">
            {TIERS.map((tier) => (
              <div
                key={tier.tier}
                className={`surface p-5 ${tier.tier === current ? "ring-2 ring-[var(--p-accent)]" : ""}`}
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold">{toTitle(tier.tier)}</div>
                  {tier.tier === current && (
                    <Badge variant="brand">{t("console.settings.billing.current", undefined, "Current")}</Badge>
                  )}
                </div>
                <div className="mt-2 text-lg font-semibold tracking-tight">
                  {t(tier.priceKey, undefined, tier.priceFallback)}
                </div>
                <ul className="mt-3 space-y-1 text-xs text-[var(--p-text-2)]">
                  {tier.featureKeys.map((f) => (
                    <li key={f.key}>· {t(f.key, undefined, f.fallback)}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-xs tracking-[0.18em] text-[var(--p-text-2)] uppercase">
              {t("console.settings.billing.recentInvoices", undefined, "Recent invoices")}
            </h2>
            <Link href="/console/finance/invoices" className="text-xs text-[var(--p-accent)] hover:underline">
              {t("console.settings.billing.viewAll", undefined, "View all →")}
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="ps-table w-full text-sm">
              <thead>
                <tr>
                  <th>{t("console.settings.billing.table.number", undefined, "Number")}</th>
                  <th>{t("console.settings.billing.table.status", undefined, "Status")}</th>
                  <th>{t("console.settings.billing.table.amount", undefined, "Amount")}</th>
                  <th>{t("console.settings.billing.table.issued", undefined, "Issued")}</th>
                  <th>{t("console.settings.billing.table.due", undefined, "Due")}</th>
                </tr>
              </thead>
              <tbody>
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-[var(--p-text-2)]">
                      {t("console.settings.billing.noInvoices", undefined, "No invoices yet.")}
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
                      <td>
                        <Badge variant="muted">{toTitle(i.invoice_state)}</Badge>
                      </td>
                      <td className="font-mono text-xs">{money(i.amount_cents)}</td>
                      <td className="font-mono text-xs">
                        {i.issued_at ? new Date(i.issued_at).toLocaleDateString() : "—"}
                      </td>
                      <td className="font-mono text-xs">{i.due_at ? new Date(i.due_at).toLocaleDateString() : "—"}</td>
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
