import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { ActivityTimeline } from "@/components/gvteway/ActivityTimeline";
import { hasSupabase } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth";
import { getRequestFormatters } from "@/lib/i18n/request";
import { urlFor } from "@/lib/urls";
import { listFriendActivity, listPublishedScenes } from "@/lib/gvteway";

export const dynamic = "force-dynamic";

type OnSaleListing = {
  slug: string;
  title: string;
  venue_name: string | null;
  starts_at: string | null;
  provider_name: string | null;
};

async function listOnSaleEvents(supabase: Awaited<ReturnType<typeof createClient>>): Promise<OnSaleListing[]> {
  const { data } = await supabase
    .from("event_listings")
    .select("slug, title, venue_name, starts_at, provider_name")
    .eq("listing_state", "published")
    .is("deleted_at", null)
    .order("starts_at", { ascending: true, nullsFirst: false })
    .limit(6);
  return (data ?? []) as OnSaleListing[];
}

/**
 * GVTEWAY · Discover — editorial discovery + friend activity (design_handoff §2,
 * Dice × Radiate). Friend activity reads `public.activity` (RLS: self +
 * followed); scenes-to-follow read published `public.scene`. Ticketing stays
 * integration-only: every handoff goes to the provider, never an in-app checkout.
 */
export default async function DiscoverPage() {
  const session = hasSupabase ? await getSession() : null;
  const supabase = hasSupabase ? await createClient() : null;
  const fmt = await getRequestFormatters();
  const [activity, scenes, onSale] = await Promise.all([
    session && supabase ? listFriendActivity(supabase, 12) : Promise.resolve([]),
    supabase ? listPublishedScenes(supabase) : Promise.resolve([]),
    supabase ? listOnSaleEvents(supabase) : Promise.resolve([] as OnSaleListing[]),
  ]);

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-6 py-8">
      <header className="space-y-2">
        <p className="font-mono text-xs tracking-[0.14em] text-[var(--p-accent-text)] uppercase">GVTEWAY</p>
        <h1 className="text-3xl font-bold tracking-tight">Discover</h1>
        <p className="text-[var(--p-text-2)]">Events your scenes are into, and what your friends are saving.</p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <section className="space-y-3">
          <h2 className="text-sm font-semibold tracking-wide text-[var(--p-text-2)] uppercase">From your friends</h2>
          <ActivityTimeline
            items={activity}
            emptyTitle={session ? "Quiet for now" : "Sign in to tune your feed"}
            emptyDescription={
              session
                ? "Follow a few friends and scenes and their saves and RSVPs surface here."
                : "Once you’re in, what your friends are saving shapes what you see first."
            }
          />
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-wide text-[var(--p-text-2)] uppercase">Scenes to follow</h2>
            <Link
              href="/p/scenes"
              className="inline-flex items-center gap-1 text-xs font-medium text-[var(--p-accent-text)] hover:underline"
            >
              All <ArrowRight size={12} aria-hidden="true" />
            </Link>
          </div>
          {scenes.length === 0 ? (
            <EmptyState size="compact" title="No scenes yet" description="Published scenes will show up here." />
          ) : (
            <ul className="space-y-2">
              {scenes.slice(0, 5).map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/p/scenes/${s.slug}`}
                    className="surface hover-lift focus-ring block rounded-[var(--p-r-md)] p-3 text-sm font-medium text-[var(--p-text-1)]"
                  >
                    {s.name}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold tracking-wide text-[var(--p-text-2)] uppercase">On sale now</h2>
        <p className="max-w-xl text-sm text-[var(--p-text-3)]">
          GVTEWAY never sells you a ticket directly. Every event hands off to the provider that owns it.
        </p>
        {onSale.length === 0 ? (
          <EmptyState
            size="compact"
            title="Nothing on sale right now"
            description="When an event you can buy tickets to goes live, it shows up here with a link to its ticketing provider."
          />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {onSale.map((e) => (
              <li key={e.slug}>
                <a
                  href={urlFor("marketing", `/events/${e.slug}`)}
                  className="surface hover-lift focus-ring block rounded-[var(--p-r-md)] p-4"
                >
                  <div className="truncate text-sm font-semibold text-[var(--p-text-1)]">{e.title}</div>
                  <div className="mt-1 text-xs text-[var(--p-text-2)]">
                    {[
                      e.venue_name,
                      e.starts_at
                        ? fmt.dateParts(new Date(e.starts_at), {
                            month: "short",
                            day: "numeric",
                          })
                        : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </div>
                  <div className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[var(--p-accent-text)]">
                    Get tickets
                    {e.provider_name ? (
                      <span className="font-normal text-[var(--p-text-3)]">via {e.provider_name}</span>
                    ) : null}
                    <ArrowRight size={12} aria-hidden="true" />
                  </div>
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
