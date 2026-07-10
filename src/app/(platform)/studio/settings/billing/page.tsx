import { ModuleHeader } from "@/components/Shell";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { isAdmin, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase, env } from "@/lib/env";
import { httpFetch } from "@/lib/http";
import { toTitle } from "@/lib/format";
import { formatMoney } from "@/lib/i18n/format";
import { urlFor } from "@/lib/urls";
import { getRequestT, getRequestFormatters } from "@/lib/i18n/request";
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

/** Minimal shape of a Stripe invoice list item (REST, no SDK dep). */
type StripeInvoice = {
  id: string;
  number: string | null;
  status: string | null;
  total: number;
  currency: string;
  created: number;
  hosted_invoice_url: string | null;
};

/**
 * Fetch the org's SUBSCRIPTION invoices from Stripe (the correct data model
 * for this page — the previous version listed the org's own AR invoices,
 * i.e. what the org bills ITS clients, on the workspace-subscription page).
 * Returns null when Stripe is unreachable so the caller can distinguish
 * "no invoices" from "could not load".
 */
async function fetchStripeInvoices(customerId: string): Promise<StripeInvoice[] | null> {
  try {
    const res = await httpFetch(
      `https://api.stripe.com/v1/invoices?customer=${encodeURIComponent(customerId)}&limit=6`,
      {
        headers: { authorization: `Bearer ${env.STRIPE_SECRET_KEY}` },
        timeoutMs: 8000,
      },
    );
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: StripeInvoice[] };
    return json.data ?? [];
  } catch {
    return null;
  }
}

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const { t } = await getRequestT();
  const fmt = await getRequestFormatters();
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
  // View gate (readiness finding P1-A): this surface exposes org billing /
  // API-key state. Mutations were already admin-gated server-side; the page
  // itself now denies non-admins gracefully instead of relying on nav hiding.
  if (!isAdmin(session)) {
    return (
      <>
        <ModuleHeader
          title="Admin Access Required"
          subtitle="This area is limited to organization owners and admins."
        />
        <div className="page-content">
          <EmptyState
            title="You Need Admin Access"
            description="Ask an organization owner or admin if you believe you should have access to this page."
          />
        </div>
      </>
    );
  }
  const supabase = await createClient();
  const { data: org } = await supabase
    .from("orgs")
    .select("tier, stripe_customer_id")
    .eq("id", session.orgId)
    .maybeSingle();
  const current = (org?.tier as string | undefined) ?? "access";
  const stripeConfigured = Boolean(env.STRIPE_SECRET_KEY);
  const currentTier = TIERS.find((tier) => tier.tier === current);

  // Subscription invoices come from Stripe — the org's AR invoices
  // (/studio/finance/invoices) are a different domain and don't belong here.
  const stripeCustomerId = (org?.stripe_customer_id as string | null | undefined) ?? null;
  const stripeInvoices = stripeConfigured && stripeCustomerId ? await fetchStripeInvoices(stripeCustomerId) : undefined;

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.settings.billing.eyebrow", undefined, "Settings")}
        title={t("console.settings.billing.title", undefined, "Billing")}
        subtitle={t(
          "console.settings.billing.pageSubtitle",
          undefined,
          "Your plan, payment method, and subscription invoices",
        )}
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
              <div className="mt-1 flex items-center gap-2">
                <span className="text-base font-semibold">{toTitle(current)}</span>
                {currentTier && (
                  <span className="text-sm text-[var(--p-text-2)]">
                    {t(currentTier.priceKey, undefined, currentTier.priceFallback)}
                  </span>
                )}
              </div>
              {currentTier && (
                <ul className="mt-2 space-y-1 text-xs text-[var(--p-text-2)]">
                  {currentTier.featureKeys.map((f) => (
                    <li key={f.key}>· {t(f.key, undefined, f.fallback)}</li>
                  ))}
                </ul>
              )}
            </div>
            <div className="flex flex-col items-end gap-2">
              <OpenPortalButton disabled={!stripeConfigured} />
              <a href={urlFor("marketing", "/pricing")} className="text-xs text-[var(--p-accent-text)] hover:underline">
                {t("console.settings.billing.comparePlans", undefined, "Compare plans")}
              </a>
            </div>
          </div>
          <p className="mt-3 text-xs text-[var(--p-text-2)]">
            {t(
              "console.settings.billing.changePlanHint",
              undefined,
              "Plan changes, payment methods, and cancellation are managed in the Stripe billing portal.",
            )}
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xs tracking-[0.18em] text-[var(--p-text-2)] uppercase">
            {t("console.settings.billing.subscriptionInvoices", undefined, "Subscription invoices")}
          </h2>
          {stripeInvoices === undefined ? (
            <div className="surface p-5 text-sm text-[var(--p-text-2)]">
              {t(
                "console.settings.billing.noStripeCustomer",
                undefined,
                "No subscription billing history yet. Invoices from your ATLVS subscription will appear here once billing is set up.",
              )}
            </div>
          ) : stripeInvoices === null ? (
            <Alert kind="warning">
              {t(
                "console.settings.billing.stripeInvoicesError",
                undefined,
                "Could not load subscription invoices from Stripe. Open the billing portal to view them, or try again shortly.",
              )}
            </Alert>
          ) : stripeInvoices.length === 0 ? (
            <div className="surface p-5 text-sm text-[var(--p-text-2)]">
              {t("console.settings.billing.noInvoices", undefined, "No invoices yet.")}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="ps-table w-full text-sm">
                <thead>
                  <tr>
                    <th>{t("console.settings.billing.table.number", undefined, "Number")}</th>
                    <th>{t("console.settings.billing.table.status", undefined, "Status")}</th>
                    <th>{t("console.settings.billing.table.amount", undefined, "Amount")}</th>
                    <th>{t("console.settings.billing.table.issued", undefined, "Issued")}</th>
                    <th>{t("console.settings.billing.table.invoice", undefined, "Invoice")}</th>
                  </tr>
                </thead>
                <tbody>
                  {stripeInvoices.map((i) => (
                    <tr key={i.id}>
                      <td className="font-mono text-xs">{i.number ?? i.id}</td>
                      <td>
                        <Badge variant={i.status === "paid" ? "success" : "muted"}>
                          {toTitle(i.status ?? "draft")}
                        </Badge>
                      </td>
                      <td className="font-mono text-xs">{formatMoney(i.total, i.currency?.toUpperCase())}</td>
                      <td className="font-mono text-xs">{fmt.date(new Date(i.created * 1000))}</td>
                      <td>
                        {i.hosted_invoice_url ? (
                          <a
                            href={i.hosted_invoice_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-[var(--p-accent-text)] hover:underline"
                          >
                            {t("console.settings.billing.viewInvoice", undefined, "View")}
                          </a>
                        ) : (
                          <span className="text-xs text-[var(--p-text-3)]">
                            {t("console.settings.billing.noLink", undefined, "N/A")}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
