import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Alert } from "@/components/ui/Alert";
import { buildMetadata } from "@/lib/seo";
import { formatMoney, cartSubtotalCents, cartItemCount } from "@/lib/commerce_store";
import { getCurrentCart, getCartLines } from "../cart";
import { CartItemRow } from "../_components/CartItemRow";
import { CheckoutButton } from "../_components/CheckoutButton";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    title: "Cart",
    description: "Review your GVTEWAY store cart.",
    path: "/marketplace/store/cart",
  });
}

export default async function CartPage({ searchParams }: { searchParams: Promise<{ checkout?: string }> }) {
  const { checkout } = await searchParams;
  const cart = await getCurrentCart();
  const lines = cart ? await getCartLines(cart.id) : [];
  const subtotal = cartSubtotalCents(lines.map((l) => l.item));
  const count = cartItemCount(lines.map((l) => l.item));
  const currency = cart?.currency ?? "USD";

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Marketplace", href: "/marketplace" },
          { label: "Store", href: "/marketplace/store" },
          { label: "Cart" },
        ]}
        className="mx-auto max-w-4xl px-6 pt-6"
      />

      <section className="mx-auto max-w-4xl px-6 pt-8 pb-16">
        <h1 className="hed-xl mb-6">Cart</h1>

        {checkout === "success" && (
          <Alert kind="success" className="mb-6">
            Payment received — thank you. Your order is being processed.
          </Alert>
        )}
        {checkout === "cancelled" && (
          <Alert kind="warning" className="mb-6">
            Checkout was cancelled. Your cart is still here.
          </Alert>
        )}

        {lines.length === 0 ? (
          <div className="surface p-6 text-sm text-[var(--p-text-2)]">
            Your cart is empty.{" "}
            <Link href="/marketplace/store" className="underline">
              Browse the store
            </Link>
            .
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <div className="surface divide-y divide-[var(--p-border)]">
              {lines.map((line) => (
                <CartItemRow
                  key={line.item.id}
                  itemId={line.item.id}
                  title={line.product.title}
                  variantTitle={line.variant?.title ?? null}
                  imageUrl={line.product.image_url}
                  unitPriceCents={line.item.unit_price_cents}
                  quantity={line.item.quantity}
                  maxQty={Math.max(1, line.variant?.inventory_qty ?? line.product.inventory_qty)}
                  currency={currency}
                />
              ))}
            </div>

            <div className="surface flex items-center justify-between p-5">
              <div>
                <p className="text-sm text-[var(--p-text-2)]">
                  Subtotal · {count === 1 ? "1 item" : `${count} items`}
                </p>
                <p className="text-xl font-semibold tabular-nums">{formatMoney(subtotal, currency)}</p>
              </div>
              <CheckoutButton />
            </div>
          </div>
        )}
      </section>
    </>
  );
}
