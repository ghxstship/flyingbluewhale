import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { buildMetadata } from "@/lib/seo";
import { urlFor } from "@/lib/urls";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { TicketPurchase, type PurchaseTicketType } from "./TicketPurchase";

export const dynamic = "force-dynamic";

type Listing = { id: string; slug: string; title: string };

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
    .select("id, slug, title")
    .eq("slug", slug)
    .eq("listing_state", "published")
    .is("deleted_at", null)
    .maybeSingle();
  const listing = listingData as Listing | null;
  if (!listing) notFound();

  const { data: ticketData } = await supabase
    .from("event_ticket_types")
    .select("id, name, description, price_cents, currency, sales_state")
    .eq("event_listing_id", listing.id)
    .is("deleted_at", null)
    .order("sort_order", { ascending: true });
  const tickets = (ticketData ?? []) as PurchaseTicketType[];

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
          <div className="rounded-lg border border-[var(--p-border)] bg-[var(--p-success)]/10 p-4 text-sm text-[var(--p-success-text)]">
            Payment received — your tickets are on the way by email.
          </div>
        )}
        {checkout === "cancelled" && (
          <div className="rounded-lg border border-[var(--p-border)] bg-[var(--p-surface)] p-4 text-sm text-[var(--p-text-2)]">
            Checkout cancelled. Your selection wasn’t charged.
          </div>
        )}

        {tickets.length === 0 ? (
          <div className="surface p-6 text-sm text-[var(--p-text-2)]">Tickets are not on sale for this event yet.</div>
        ) : (
          <TicketPurchase slug={listing.slug} tickets={tickets} soldOutLabel="Sold out" />
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
