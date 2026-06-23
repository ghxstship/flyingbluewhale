import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { buildMetadata } from "@/lib/seo";
import { formatDate } from "@/lib/i18n/format";
import type { LooseSupabase } from "@/lib/supabase/loose";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    title: "Events",
    description: "Browse upcoming events and get tickets.",
    path: "/events",
  });
}

type Listing = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  hero_image: string | null;
  venue_name: string | null;
  starts_at: string | null;
};

/**
 * /events — the public box-office listing surface (IMPLEMENTATION §5). Renders
 * published event_listings (anon-readable via RLS); each links to its event
 * page and ticketing flow.
 */
export default async function EventsPage() {
  let rows: Listing[] = [];
  if (hasSupabase) {
    const supabase = (await createClient()) as unknown as LooseSupabase;
    const { data } = await supabase
      .from("event_listings")
      .select("id, slug, title, summary, hero_image, venue_name, starts_at")
      .eq("listing_state", "published")
      .is("deleted_at", null)
      .order("starts_at", { ascending: true })
      .limit(60);
    rows = (data ?? []) as Listing[];
  }

  return (
    <>
      <Breadcrumbs items={[{ label: "Events" }]} className="mx-auto max-w-6xl px-6 pt-6" />

      <section className="mx-auto max-w-6xl px-6 pt-8 pb-8">
        <div className="eyebrow eyebrow-brand">Box Office</div>
        <h1 className="hed-2xl mt-4">Events</h1>
        <p className="mt-3 text-sm text-[var(--p-text-2)]">
          {rows.length === 1 ? "1 upcoming event" : `${rows.length} upcoming events`}
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16">
        {rows.length === 0 ? (
          <div className="surface p-6 text-sm text-[var(--p-text-2)]">No events are on sale right now.</div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((e) => (
              <Link key={e.id} href={`/events/${e.slug}`} className="surface hover-lift flex flex-col gap-3 p-5">
                {e.hero_image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={e.hero_image} alt={e.title} className="aspect-video w-full rounded-md object-cover" />
                ) : (
                  <div className="surface-inset aspect-video w-full rounded-md" aria-hidden="true" />
                )}
                <div>
                  <h3 className="text-base font-semibold tracking-tight">{e.title}</h3>
                  {e.starts_at && (
                    <p className="mt-1 font-mono text-xs text-[var(--p-text-3)]">{formatDate(e.starts_at, "long")}</p>
                  )}
                  {e.venue_name && <p className="mt-0.5 text-sm text-[var(--p-text-2)]">{e.venue_name}</p>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
