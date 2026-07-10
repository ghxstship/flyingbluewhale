import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { buildMetadata } from "@/lib/seo";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { formatMoney, type StoreProduct } from "@/lib/commerce_store";
import { getCurrentCart, getCartLines } from "./cart";
import { cartItemCount } from "@/lib/commerce_store";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    title: "Store",
    description: "Browse and buy from GVTEWAY producers — official merch, gear, and event goods.",
    path: "/marketplace/store",
  });
}

export default async function StorePage() {
  let rows: StoreProduct[] = [];
  if (hasSupabase) {
    const supabase = (await createClient()) as unknown as LooseSupabase;
    // Anon-readable: RLS exposes only product_state='published' rows.
    const { data } = await supabase
      .from("store_products")
      .select("*")
      .eq("product_state", "published")
      .order("published_at", { ascending: false })
      .limit(60);
    rows = (data ?? []) as StoreProduct[];
  }

  const cart = await getCurrentCart();
  const count = cart ? cartItemCount((await getCartLines(cart.id)).map((l) => l.item)) : 0;

  return (
    <>
      <Breadcrumbs
        items={[{ label: "Marketplace", href: "/marketplace" }, { label: "Store" }]}
        className="mx-auto max-w-6xl px-6 pt-6"
      />

      <section className="mx-auto max-w-6xl px-6 pt-8 pb-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="eyebrow eyebrow-brand">GVTEWAY Store</div>
            <h1 className="hed-2xl mt-4">Shop</h1>
            <p className="mt-3 text-sm text-[var(--p-text-2)]">
              {rows.length === 1 ? "1 product" : `${rows.length} products`}
            </p>
          </div>
          <Link href="/marketplace/store/cart" className="surface hover-lift px-4 py-2 text-sm font-medium">
            Cart{count > 0 ? ` (${count})` : ""}
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16">
        {rows.length === 0 ? (
          <div className="surface p-6 text-sm text-[var(--p-text-2)]">No products are available right now.</div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((p) => (
              <Link
                key={p.id}
                href={`/marketplace/store/${p.slug}`}
                className="surface hover-lift flex flex-col gap-3 p-5"
              >
                {p.image_url ? (
                  // Remote merch imagery — plain img keeps the public page
                  // free of next/image domain config for arbitrary orgs.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.image_url}
                    alt={p.title}
                    loading="lazy"
                    decoding="async"
                    className="aspect-square w-full rounded-md object-cover"
                  />
                ) : (
                  <div className="surface-inset aspect-square w-full rounded-md" aria-hidden="true" />
                )}
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-base font-semibold tracking-tight">{p.title}</h3>
                  <span className="text-sm font-semibold tabular-nums">{formatMoney(p.price_cents, p.currency)}</span>
                </div>
                {p.inventory_qty <= 0 && <span className="text-xs text-[var(--p-text-2)]">Sold out</span>}
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
