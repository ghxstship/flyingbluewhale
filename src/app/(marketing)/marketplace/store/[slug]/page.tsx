import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { buildMetadata, productSchema } from "@/lib/seo";
import { JsonLd } from "@/components/marketing/JsonLd";
import { urlFor } from "@/lib/urls";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { formatMoney, type StoreProduct, type StoreProductVariant } from "@/lib/commerce_store";
import { AddToCartForm } from "../_components/AddToCartForm";

export const dynamic = "force-dynamic";

async function fetchProduct(slug: string): Promise<{ product: StoreProduct; variants: StoreProductVariant[] } | null> {
  if (!hasSupabase) return null;
  const supabase = (await createClient()) as unknown as LooseSupabase;
  const { data } = await supabase
    .from("store_products")
    .select("*")
    .is("deleted_at", null)
    .eq("slug", slug)
    .eq("product_state", "published")
    .maybeSingle();
  if (!data) return null;
  const product = data as StoreProduct;
  const { data: vData } = await supabase
    .from("store_product_variants")
    .select("*")
    .is("deleted_at", null)
    .eq("product_id", product.id)
    .order("sort_order", { ascending: true });
  return { product, variants: (vData ?? []) as StoreProductVariant[] };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const found = await fetchProduct(slug);
  if (!found) {
    // No published product at this slug → the page 404s; don't let the thin
    // "Product" fallback get indexed.
    return buildMetadata({
      title: "Product",
      description: "Shop the GVTEWAY store.",
      path: `/marketplace/store/${slug}`,
      noIndex: true,
    });
  }
  return buildMetadata({
    title: found.product.title,
    description: found.product.description ?? "Shop the GVTEWAY store.",
    path: `/marketplace/store/${slug}`,
  });
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const found = await fetchProduct(slug);
  if (!found) notFound();
  const { product, variants } = found;
  const soldOut = product.inventory_qty <= 0;

  return (
    <>
      <JsonLd
        data={[
          productSchema({
            name: product.title,
            description: product.description ?? `${product.title}, available in the GVTEWAY store.`,
            url: urlFor("marketing", `/marketplace/store/${product.slug}`),
            sku: product.id,
            price: (product.price_cents / 100).toFixed(2),
            currency: product.currency,
            inStock: !soldOut,
          }),
        ]}
      />
      <Breadcrumbs
        items={[
          { label: "Marketplace", href: "/marketplace" },
          { label: "Store", href: "/marketplace/store" },
          { label: product.title },
        ]}
        className="mx-auto max-w-5xl px-6 pt-6"
      />

      <section className="mx-auto grid max-w-5xl grid-cols-1 gap-8 px-6 pt-8 pb-16 md:grid-cols-2">
        <div>
          {product.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.image_url}
              alt={product.title}
              decoding="async"
              className="aspect-square w-full rounded-md object-cover"
            />
          ) : (
            <div className="surface-inset aspect-square w-full rounded-md" aria-hidden="true" />
          )}
        </div>

        <div className="flex flex-col gap-4">
          <h1 className="hed-xl">{product.title}</h1>
          <p className="text-xl font-semibold tabular-nums">{formatMoney(product.price_cents, product.currency)}</p>

          {product.description && (
            <p className="whitespace-pre-line text-sm text-[var(--p-text-2)]">{product.description}</p>
          )}

          {soldOut ? (
            <div className="surface-inset p-4 text-sm text-[var(--p-text-2)]">This product is sold out.</div>
          ) : (
            <AddToCartForm
              productId={product.id}
              variants={variants
                .filter((v) => !v.deleted_at)
                .map((v) => ({
                  id: v.id,
                  title: v.title,
                  price_cents: v.price_cents,
                  inventory_qty: v.inventory_qty,
                }))}
              basePriceCents={product.price_cents}
              currency={product.currency}
            />
          )}

          {product.sku && <p className="text-xs text-[var(--p-text-2)]">SKU: {product.sku}</p>}
        </div>
      </section>
    </>
  );
}
