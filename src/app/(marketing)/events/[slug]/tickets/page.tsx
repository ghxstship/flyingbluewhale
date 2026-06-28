import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { buildMetadata } from "@/lib/seo";
import { urlFor } from "@/lib/urls";
import { formatMoney } from "@/lib/commerce_store";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { TicketPurchase, type PurchaseTicketType } from "./TicketPurchase";

export const dynamic = "force-dynamic";

type Listing = { id: string; slug: string; title: string; fulfillment: string };

type TicketTypeRow = {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  currency: string;
  sales_state: string;
  quantity_total: number;
  quantity_sold: number;
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return buildMetadata({ title: "Tickets", description: "Buy tickets.", path: `/events/${slug}/tickets` });
}

export default async function EventTicketsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ checkout?: string }>;
}) {
  const { slug } = await params;
  const { checkout } = await searchParams;
  if (!hasSupabase) notFound();

  const supabase = (await createClient()) as unknown as LooseSupabase;
  const { data: listingData } = await supabase
    .from("event_listings")
    .select("id, slug, title, fulfillment")
    .eq("slug", slug)
    .eq("listing_state", "published")
    .is("deleted_at", null)
    .maybeSingle();
  const listing = listingData as Listing | null;
  if (!listing) notFound();

  const { data: ticketData } = await supabase
    .from("event_ticket_types")
    .select("id, name, description, price_cents, currency, sales_state, quantity_total, quantity_sold")
    .eq("event_listing_id", listing.id)
    .is("deleted_at", null)
    .order("sort_order", { ascending: true });
  const ticketRows = (ticketData ?? []) as TicketTypeRow[];

  const isFirstParty = listing.fulfillment === "first_party";

  // First-party tickets carry remaining inventory + a ceiling for the stepper.
  const tickets: PurchaseTicketType[] = ticketRows.map((tt) => {
    const remaining = Math.max(0, tt.quantity_total - tt.quantity_sold);
    return {
      id: tt.id,
      name: tt.name,
      description: tt.description,
      price_cents: tt.price_cents,
      currency: tt.currency,
      sales_state: tt.sales_state,
      remaining,
    };
  });

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Events", href: "/events" },
          { label: listing.title, href: `/events/${listing.slug}` },
          { label: "Tickets" },
        ]}
        className="mx-auto max-w-2xl px-6 pt-6"
      />

      <section className="mx-auto max-w-2xl space-y-6 px-6 pt-6 pb-16">
        <header className="space-y-1">
          <div className="eyebrow eyebrow-brand">Tickets</div>
          <h1 className="hed-xl">{listing.title}</h1>
        </header>

        {checkout === "success" && (
          <div className="rounded-lg border border-[var(--p-border)] bg-[var(--p-success)]/10 p-5">
            <div className="text-sm font-semibold text-[var(--p-success-text)]">You&rsquo;re in.</div>
            <ol className="mt-3 flex flex-wrap items-center gap-2 text-xs font-medium text-[var(--p-text-2)]">
              {["Paid", "Pass issued", "In wallet"].map((step, i) => (
                <li key={step} className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--p-surface-2)] px-2.5 py-1 text-[var(--p-text-1)]">
                    <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[var(--p-success)]" />
                    {step}
                  </span>
                  {i < 2 && (
                    <span aria-hidden className="text-[var(--p-text-3)]">
                      &rarr;
                    </span>
                  )}
                </li>
              ))}
            </ol>
            <p className="mt-3 text-sm text-[var(--p-text-2)]">
              Your pass is on its way to your email. View it anytime in your account.
            </p>
            <Link
              href={urlFor("personal", "/me/tickets")}
              className="mt-3 inline-block rounded-[var(--p-r,8px)] border border-[var(--p-border-2)] px-4 py-2 text-sm font-medium text-[var(--p-text-1)] hover:bg-[var(--p-surface-2)]"
            >
              View my tickets
            </Link>
          </div>
        )}
        {checkout === "cancelled" && (
          <div className="rounded-lg border border-[var(--p-border)] bg-[var(--p-surface)] p-4 text-sm text-[var(--p-text-2)]">
            Checkout cancelled. Your selection wasn&rsquo;t charged.
          </div>
        )}

        {tickets.length === 0 ? (
          <div className="surface p-6 text-sm text-[var(--p-text-2)]">Tickets are not on sale for this event yet.</div>
        ) : isFirstParty ? (
          <TicketPurchase slug={listing.slug} tickets={tickets} soldOutLabel="Sold out" />
        ) : (
          // Provider-aggregated events: read-only price list + handoff to the
          // provider's own purchase flow. First-party checkout stays first-party.
          <ul className="divide-y divide-[var(--p-border)] rounded-lg border border-[var(--p-border)]">
            {tickets.map((tt) => (
              <li key={tt.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-[var(--p-text-1)]">{tt.name}</div>
                  {tt.description && <p className="text-xs text-[var(--p-text-2)]">{tt.description}</p>}
                </div>
                <div className="text-sm font-semibold tabular-nums">{formatMoney(tt.price_cents, tt.currency)}</div>
              </li>
            ))}
          </ul>
        )}

        <div className="rounded-lg border border-[var(--p-border)] bg-[var(--p-surface)] p-5">
          <h2 className="text-sm font-semibold text-[var(--p-text-1)]">Already have a ticket?</h2>
          <p className="mt-1 text-sm text-[var(--p-text-2)]">
            Claim, view, or transfer your tickets from your account.
          </p>
          <Link
            href={urlFor("personal", "/me/tickets")}
            className="mt-3 inline-block rounded-[var(--p-r,8px)] border border-[var(--p-border-2)] px-4 py-2 text-sm font-medium text-[var(--p-text-1)] hover:bg-[var(--p-surface-2)]"
          >
            Claim / transfer tickets
          </Link>
        </div>
      </section>
    </>
  );
}
