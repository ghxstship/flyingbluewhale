import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { AccessDenied } from "@/components/ui/AccessDenied";
import { ConfigureSupabase } from "@/components/ui/ConfigureSupabase";
import { requireSession, isManagerPlus } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";
import {
  formatPrice,
  PRODUCT_KIND_LABELS,
  VOUCHER_STATE_TONES,
  type CreditProduct,
  type Voucher,
  type VoucherState,
} from "@/lib/legend_store";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { setProductStateAction, voidVoucherAction } from "./actions";

export const dynamic = "force-dynamic";

/**
 * /legend/store/admin — the stocking console (readiness blocker B-4b).
 * Manager+ only: credit-product CRUD (packs + credit-priced items) and
 * voucher minting/voiding. Before this surface existed an org could not
 * stock its own store without SQL.
 */
export default async function StoreAdminPage({ searchParams }: { searchParams: Promise<{ minted?: string }> }) {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.legend.storeAdmin.eyebrow", undefined, "LEG3ND · Manage")}
          title={t("console.legend.storeAdmin.title", undefined, "Store Admin")}
        />
        <ConfigureSupabase />
      </>
    );
  }
  const session = await requireSession();
  if (!isManagerPlus(session)) {
    return <AccessDenied requiredRole="Manager" backHref="/legend/store" />;
  }
  const db = (await createClient()) as unknown as LooseSupabase;
  const fmt = await getRequestFormatters();
  const { minted } = await searchParams;

  const [{ data: productData }, { data: voucherData }] = await Promise.all([
    // select("*") on purpose — pre-migration the table lacks product_kind /
    // stock_qty and naming them would error the query (see /legend/store).
    db.from("credit_products").select("*").eq("org_id", session.orgId).is("deleted_at", null).order("created_at", { ascending: false }),
    db
      .from("vouchers")
      .select("id, code, credits, max_redemptions, redeemed_count, expires_on, voucher_state")
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(200),
  ]);
  const products = (productData ?? []) as CreditProduct[];
  const vouchers = (voucherData ?? []) as Voucher[];

  const voucherStateLabels: Record<VoucherState, string> = {
    active: t("console.legend.storeAdmin.vouchers.stateActive", undefined, "Active"),
    redeemed: t("console.legend.storeAdmin.vouchers.stateRedeemed", undefined, "Redeemed"),
    expired: t("console.legend.storeAdmin.vouchers.stateExpired", undefined, "Expired"),
    void: t("console.legend.storeAdmin.vouchers.stateVoid", undefined, "Void"),
  };

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.legend.storeAdmin.eyebrow", undefined, "LEG3ND · Manage")}
        title={t("console.legend.storeAdmin.title", undefined, "Store Admin")}
        subtitle={t(
          "console.legend.storeAdmin.subtitle",
          undefined,
          "Stock credit packs and redeemable items, mint voucher codes.",
        )}
      />

      {minted ? (
        <p className="mb-4 surface p-3 text-sm text-[var(--p-success)]">
          {t("console.legend.storeAdmin.mintedBanner", { count: minted }, `Minted ${minted} voucher codes.`)}
        </p>
      ) : null}

      <section className="mb-8 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="eyebrow">{t("console.legend.storeAdmin.products", undefined, "Products")}</h2>
          <Link href="/legend/store/admin/products/new" className="ps-btn ps-btn--cta">
            {t("console.legend.storeAdmin.newProduct", undefined, "New Product")}
          </Link>
        </div>
        {products.length === 0 ? (
          <EmptyState
            size="compact"
            title={t("console.legend.storeAdmin.noProductsTitle", undefined, "Nothing stocked yet")}
            description={t(
              "console.legend.storeAdmin.noProductsDescription",
              undefined,
              "Create a credit pack learners buy with money, or an item they redeem with credits.",
            )}
          />
        ) : (
          <div className="surface overflow-x-auto">
            <table className="ps-table w-full">
              <thead>
                <tr>
                  <th>{t("console.legend.storeAdmin.col.product", undefined, "Product")}</th>
                  <th>{t("console.legend.storeAdmin.col.kind", undefined, "Kind")}</th>
                  <th>{t("console.legend.storeAdmin.col.credits", undefined, "Credits")}</th>
                  <th>{t("console.legend.storeAdmin.col.price", undefined, "Price")}</th>
                  <th>{t("console.legend.storeAdmin.col.stock", undefined, "Stock")}</th>
                  <th>{t("console.legend.storeAdmin.col.state", undefined, "State")}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const kind = (p.product_kind ?? "pack") as CreditProduct["product_kind"];
                  return (
                    <tr key={p.id}>
                      <td>
                        <Link href={`/legend/store/admin/products/${p.id}`} className="font-medium text-[var(--p-text-1)] hover:underline">
                          {p.name}
                        </Link>
                        <div className="ps-id text-xs text-[var(--p-text-3)]">{p.sku}</div>
                      </td>
                      <td>{PRODUCT_KIND_LABELS[kind]}</td>
                      <td className="tabular-nums">{fmt.number(p.credits)}</td>
                      <td className="tabular-nums">
                        {kind === "pack"
                          ? formatPrice(p.price_cents, p.currency)
                          : t("console.legend.storeAdmin.nCredits", { count: fmt.number(p.credits) }, `${fmt.number(p.credits)} credits`)}
                      </td>
                      <td className="tabular-nums">
                        {kind === "item"
                          ? p.stock_qty === null || p.stock_qty === undefined
                            ? t("console.legend.storeAdmin.unlimited", undefined, "Unlimited")
                            : fmt.number(p.stock_qty)
                          : "·"}
                      </td>
                      <td>
                        <Badge variant={p.product_state === "active" ? "success" : "muted"}>
                          {p.product_state === "active"
                            ? t("console.legend.storeAdmin.form.stateActive", undefined, "Active")
                            : t("console.legend.storeAdmin.form.stateArchived", undefined, "Archived")}
                        </Badge>
                      </td>
                      <td className="text-right">
                        <form action={setProductStateAction.bind(null, p.id, p.product_state === "active" ? "archived" : "active")}>
                          <button type="submit" className="ps-btn ps-btn--tertiary ps-btn--sm">
                            {p.product_state === "active"
                              ? t("console.legend.storeAdmin.retire", undefined, "Retire")
                              : t("console.legend.storeAdmin.reactivate", undefined, "Reactivate")}
                          </button>
                        </form>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="eyebrow">{t("console.legend.storeAdmin.vouchersTitle", undefined, "Vouchers")}</h2>
          <Link href="/legend/store/admin/vouchers/new" className="ps-btn ps-btn--secondary">
            {t("console.legend.storeAdmin.newBatch", undefined, "New Voucher Batch")}
          </Link>
        </div>
        {vouchers.length === 0 ? (
          <EmptyState
            size="compact"
            title={t("console.legend.storeAdmin.noVouchersTitle", undefined, "No vouchers minted")}
            description={t(
              "console.legend.storeAdmin.noVouchersDescription",
              undefined,
              "Mint a batch of codes to hand out credits without a purchase.",
            )}
          />
        ) : (
          <div className="surface overflow-x-auto">
            <table className="ps-table w-full">
              <thead>
                <tr>
                  <th>{t("console.legend.storeAdmin.col.code", undefined, "Code")}</th>
                  <th>{t("console.legend.storeAdmin.col.credits", undefined, "Credits")}</th>
                  <th>{t("console.legend.storeAdmin.col.redemptions", undefined, "Redemptions")}</th>
                  <th>{t("console.legend.storeAdmin.col.expires", undefined, "Expires")}</th>
                  <th>{t("console.legend.storeAdmin.col.state", undefined, "State")}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {vouchers.map((v) => (
                  <tr key={v.id}>
                    <td className="ps-id">{v.code}</td>
                    <td className="tabular-nums">{fmt.number(v.credits)}</td>
                    <td className="tabular-nums">
                      {fmt.number(v.redeemed_count)} / {fmt.number(v.max_redemptions)}
                    </td>
                    <td>{v.expires_on ?? t("console.legend.storeAdmin.noExpiry", undefined, "None")}</td>
                    <td>
                      <Badge variant={VOUCHER_STATE_TONES[v.voucher_state]}>{voucherStateLabels[v.voucher_state]}</Badge>
                    </td>
                    <td className="text-right">
                      {v.voucher_state === "active" ? (
                        <form action={voidVoucherAction.bind(null, v.id)}>
                          <button type="submit" className="ps-btn ps-btn--tertiary ps-btn--sm">
                            {t("console.legend.storeAdmin.voidVoucher", undefined, "Void")}
                          </button>
                        </form>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
