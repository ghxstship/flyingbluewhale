import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getRequestT } from "@/lib/i18n/request";
import { MarketView, type Listing } from "./MarketView";

export const dynamic = "force-dynamic";

const CONDITION_LABEL: Record<string, string> = {
  new: "New",
  like_new: "Like New",
  used: "Used",
  for_parts: "For Parts",
};

/**
 * /m/market — crew Marketplace. Backed by the real `marketplace_listings`
 * table (org-scoped). Lists active listings in the kit `.mkt`/`.mcard` grid;
 * the seller can mark sold / withdraw their own rows; "List an Item" opens the
 * kit `listing` FormScreen wired to the `createListing` server action (which
 * sets org_id + seller_user_id from the session so RLS WITH CHECK passes).
 */
export default async function MarketPage() {
  const session = await requireSession();
  const supabase = await createClient();
  const { t } = await getRequestT();

  const { data } = await supabase
    .from("marketplace_listings")
    .select(
      "id, seller_user_id, title, description, price_cents, currency, item_condition, category, listing_state, created_at",
    )
    .eq("org_id", session.orgId)
    .eq("listing_state", "active")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(100);

  const rows = data ?? [];

  // Hydrate seller names.
  const sellerIds = [...new Set(rows.map((r) => r.seller_user_id))];
  const nameById = new Map<string, string>();
  if (sellerIds.length > 0) {
    const { data: users } = await supabase
      .from("users")
      .select("id, name, email")
      .in("id", sellerIds);
    for (const u of users ?? []) nameById.set(u.id, u.name || u.email || "Member");
  }

  const listings: Listing[] = rows.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description ?? null,
    priceCents: r.price_cents ?? null,
    currency: r.currency ?? "USD",
    condition: r.item_condition ? (CONDITION_LABEL[r.item_condition] ?? r.item_condition) : null,
    category: r.category ?? null,
    seller: nameById.get(r.seller_user_id) ?? t("m.market.member", undefined, "Member"),
    isMine: r.seller_user_id === session.userId,
  }));

  return (
    <div className="screen screen-anim">
      <div className="scr-eye">{t("m.market.eyebrow", undefined, "Marketplace")}</div>
      <h1 className="scr-h" style={{ marginBottom: 12 }}>
        {t("m.market.title", undefined, "Marketplace")}
      </h1>
      <MarketView
        listings={listings}
        labels={{
          listItem: t("m.market.listItem", undefined, "List an Item"),
          emptyTitle: t("m.market.emptyTitle", undefined, "No Listings Yet"),
          empty: t(
            "m.market.empty",
            undefined,
            "No active listings. Be the first to list gear, tools, or apparel.",
          ),
          listed: t("m.market.listed", undefined, "Listing posted"),
          markSold: t("m.market.markSold", undefined, "Mark Sold"),
          withdraw: t("m.market.withdraw", undefined, "Withdraw"),
          mine: t("m.market.mine", undefined, "Your Listing"),
          by: t("m.market.by", undefined, "by"),
        }}
      />
    </div>
  );
}
