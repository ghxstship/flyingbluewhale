import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { buildMetadata } from "@/lib/seo";
import { formatDate } from "@/lib/i18n/format";
import { formatMoney } from "@/lib/commerce_store";
import type { LooseSupabase } from "@/lib/supabase/loose";

export const dynamic = "force-dynamic";

type Listing = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  hero_image: string | null;
  venue_name: string | null;
  starts_at: string | null;
  ends_at: string | null;
};

type TicketType = {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  currency: string;
  sales_state: string;
};

async function loadListing(slug: string): Promise<{ listing: Listing; tickets: TicketType[] } | null> {
  if (!hasSupabase) return null;
  const supabase = (await createClient()) as unknown as LooseSupabase;
  const { data } = await supabase
    .from("event_listings")
    .select("id, slug, title, summary, hero_image, venue_name, starts_at, ends_at")
    .eq("slug", slug)
    .eq("listing_state", "published")
    .is("deleted_at", null)
    .maybeSingle();
  const listing = data as Listing | null;
  if (!listing) return null;
  const { data: ticketData } = await supabase
    .from("event_ticket_types")
    .select("id, name, description, price_cents, currency, sales_state")
    .eq("event_listing_id", listing.id)
    .is("deleted_at", null)
    .order("sort_order", { ascending: true });
  return { listing, tickets: (ticketData ?? []) as TicketType[] };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const loaded = await loadListing(slug);
  return buildMetadata({
    title: loaded?.listing.title ?? "Event",
    description: loaded?.listing.summary ?? "Event details and tickets.",
    path: `/events/${slug}`,
  });
}

export default async function EventDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const loaded = await loadListing(slug);
  if (!loaded) notFound();
  const { listing, tickets } = loaded;
  const from = tickets.filter((tk) => tk.sales_state === "on_sale").sort((a, b) => a.price_cents - b.price_cents)[0];

  return (
    <>
      <Breadcrumbs
        items={[{ label: "Events", href: "/events" }, { label: listing.title }]}
        className="mx-auto max-w-4xl px-6 pt-6"
      />

      <article className="mx-auto max-w-4xl space-y-6 px-6 pt-6 pb-16">
        {listing.hero_image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={listing.hero_image} alt={listing.title} className="aspect-video w-full rounded-lg object-cover" />
        ) : (
          <div className="surface-inset aspect-video w-full rounded-lg" aria-hidden="true" />
        )}

        <header className="space-y-2">
          <div className="eyebrow eyebrow-brand">Box Office</div>
          <h1 className="hed-2xl">{listing.title}</h1>
          {listing.starts_at && (
            <p className="font-mono text-sm text-[var(--p-text-3)]">
              {formatDate(listing.starts_at, "long")}
              {listing.ends_at ? ` – ${formatDate(listing.ends_at, "long")}` : ""}
            </p>
          )}
          {listing.venue_name && <p className="text-[var(--p-text-2)]">{listing.venue_name}</p>}
        </header>

        {listing.summary && <p className="text-lg text-[var(--p-text-2)]">{listing.summary}</p>}

        <div className="flex flex-wrap items-center gap-4 rounded-lg border border-[var(--p-border)] bg-[var(--p-surface)] p-5">
          <div className="flex-1">
            <p className="text-sm text-[var(--p-text-2)]">
              {tickets.length === 0
                ? "Tickets are not on sale yet."
                : from
                  ? `Tickets from ${formatMoney(from.price_cents, from.currency)}`
                  : "Sold out"}
            </p>
          </div>
          <Button href={`/events/${listing.slug}/tickets`} variant="cta">
            Get tickets
          </Button>
        </div>
      </article>
    </>
  );
}
