import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfigureSupabase } from "@/components/ui/ConfigureSupabase";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { formatPrice, creditBalance, ORDER_STATE_LABELS, ORDER_STATE_TONES, type CreditProduct, type OrderState } from "@/lib/legend_store";
import { BuyButton } from "./BuyButton";
import { VoucherForm } from "./VoucherForm";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

/**
 * /legend/store — the credits + voucher store. Credit packs (Stripe checkout),
 * voucher redemption, the learner's live balance (ledger sum) and order history.
 */
export default async function StorePage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.legend.store.eyebrow", undefined, "LEG3ND · Store")}
          title={t("console.legend.store.title", undefined, "Store")}
        />
        <ConfigureSupabase />
      </>
    );
  }
  const session = await requireSession();
  const db = (await createClient()) as unknown as LooseSupabase;
  const fmt = await getRequestFormatters();

  const [{ data: productData }, { data: ledgerData }, { data: orderData }] = await Promise.all([
    db
      .from("credit_products")
      .select("id, org_id, sku, name, description, credits, price_cents, currency, stripe_price_id, product_state")
      .eq("org_id", session.orgId)
      .eq("product_state", "active")
      .is("deleted_at", null)
      .order("price_cents", { ascending: true }),
    db.from("credit_ledger").select("delta").eq("org_id", session.orgId).eq("user_id", session.userId),
    db
      .from("credit_orders")
      .select("id, credits, amount_cents, currency, order_state, created_at")
      .eq("org_id", session.orgId)
      .eq("user_id", session.userId)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const products = (productData ?? []) as CreditProduct[];
  const balance = creditBalance((ledgerData ?? []) as Array<{ delta: number }>);
  const orders = (orderData ?? []) as Array<{ id: string; credits: number; amount_cents: number; currency: string; order_state: OrderState; created_at: string }>;

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.legend.store.eyebrow", undefined, "LEG3ND · Store")}
        title={t("console.legend.store.title", undefined, "Store")}
        subtitle={t("console.legend.store.subtitle", undefined, "Buy credits for courses, exams, and resources.")}
      />

      <div className="mb-6 surface flex items-center justify-between p-4">
        <span className="text-sm text-[var(--p-text-2)]">{t("console.legend.store.yourBalance", undefined, "Your balance")}</span>
        <span className="text-2xl font-bold tabular-nums text-[var(--p-text-1)]">
          {fmt.number(balance)}{" "}
          <span className="text-sm font-normal text-[var(--p-text-2)]">
            {t("console.legend.store.credits", undefined, "credits")}
          </span>
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <section className="space-y-3">
          <h2 className="eyebrow">{t("console.legend.store.creditPacks", undefined, "Credit packs")}</h2>
          {products.length === 0 ? (
            <EmptyState
              size="compact"
              title={t("console.legend.store.noPacksTitle", undefined, "No packs available")}
              description={t(
                "console.legend.store.noPacksDescription",
                undefined,
                "Credit packs configured by your org appear here.",
              )}
            />
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {products.map((p) => (
                <div key={p.id} className="surface flex flex-col gap-2 p-4">
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="text-sm font-semibold text-[var(--p-text-1)]">{p.name}</h3>
                    <span className="text-lg font-bold tabular-nums text-[var(--p-text-1)]">{formatPrice(p.price_cents, p.currency)}</span>
                  </div>
                  <p className="text-xs text-[var(--p-text-2)]">
                    {t("console.legend.store.nCredits", { count: fmt.number(p.credits) }, `${fmt.number(p.credits)} credits`)}
                    {p.description ? ` · ${p.description}` : ""}
                  </p>
                  <div className="mt-1">
                    <BuyButton productId={p.id} label={t("console.legend.store.buy", undefined, "Buy")} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <aside className="space-y-6">
          <VoucherForm />
          <div>
            <h2 className="eyebrow mb-2">{t("console.legend.store.orderHistory", undefined, "Order history")}</h2>
            {orders.length === 0 ? (
              <p className="text-sm text-[var(--p-text-2)]">{t("console.legend.store.noOrders", undefined, "No orders yet.")}</p>
            ) : (
              <ul className="surface divide-y divide-[var(--p-border)]">
                {orders.map((o) => (
                  <li key={o.id} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                    <span className="text-[var(--p-text-1)]">
                      {t("console.legend.store.nCr", { count: fmt.number(o.credits) }, `${fmt.number(o.credits)} cr`)} ·{" "}
                      {formatPrice(o.amount_cents, o.currency)}
                    </span>
                    <Badge variant={ORDER_STATE_TONES[o.order_state]}>{ORDER_STATE_LABELS[o.order_state]}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}
