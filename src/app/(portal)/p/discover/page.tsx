import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { ActivityTimeline } from "@/components/gvteway/ActivityTimeline";
import { TicketCTA } from "@/components/gvteway/TicketCTA";
import { hasSupabase } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth";
import { listFriendActivity, listPublishedScenes } from "@/lib/gvteway";

export const dynamic = "force-dynamic";

/**
 * GVTEWAY · Discover — editorial discovery + friend activity (design_handoff §2,
 * Dice × Radiate). Friend activity reads `public.activity` (RLS: self +
 * followed); scenes-to-follow read published `public.scene`. Ticketing stays
 * integration-only — every handoff goes to the provider, never an in-app checkout.
 */
export default async function DiscoverPage() {
  const session = hasSupabase ? await getSession() : null;
  const supabase = hasSupabase ? await createClient() : null;
  const [activity, scenes] = await Promise.all([
    session && supabase ? listFriendActivity(supabase, 12) : Promise.resolve([]),
    supabase ? listPublishedScenes(supabase) : Promise.resolve([]),
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
        <h2 className="text-sm font-semibold tracking-wide text-[var(--p-text-2)] uppercase">How tickets work here</h2>
        <p className="max-w-xl text-sm text-[var(--p-text-3)]">
          GVTEWAY never sells you a ticket directly — every event hands off to the provider that owns it.
        </p>
        <div className="flex flex-wrap gap-6">
          <TicketCTA state="on_sale" provider="DICE" href="https://dice.fm" />
          <TicketCTA state="selling_fast" provider="RA" href="https://ra.co" />
          <TicketCTA state="sold_out" />
          <TicketCTA state="owned" />
        </div>
      </section>
    </div>
  );
}
