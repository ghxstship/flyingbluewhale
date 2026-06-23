import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ActivityTimeline } from "@/components/gvteway/ActivityTimeline";
import { EmptyState } from "@/components/ui/EmptyState";
import { hasSupabase } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth";
import { listFriendActivity, listPublishedScenes } from "@/lib/gvteway";

export const dynamic = "force-dynamic";

/**
 * GVTEWAY · Community — friend-activity feed + scenes (design_handoff §2,
 * Dice × Radiate). Activity reads `public.activity` (RLS: self + followed
 * actors, so a session is required for a populated feed); scenes read published
 * `public.scene`.
 */
export default async function CommunityPage() {
  const session = hasSupabase ? await getSession() : null;
  const supabase = hasSupabase ? await createClient() : null;
  const [activity, scenes] = await Promise.all([
    session && supabase ? listFriendActivity(supabase) : Promise.resolve([]),
    supabase ? listPublishedScenes(supabase) : Promise.resolve([]),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-6 py-8">
      <header className="space-y-2">
        <p className="font-mono text-xs tracking-[0.14em] text-[var(--p-accent-text)] uppercase">GVTEWAY</p>
        <h1 className="text-3xl font-bold tracking-tight">Community</h1>
        <p className="text-[var(--p-text-2)]">What your people are into, and the scenes you run with.</p>
      </header>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold tracking-wide text-[var(--p-text-2)] uppercase">Activity</h2>
        <ActivityTimeline
          items={activity}
          emptyTitle={session ? "No activity yet" : "Sign in to see your friends’ activity"}
          emptyDescription={
            session
              ? "Follow friends and scenes — their saves, RSVPs, and posts land here."
              : "Once you’re in, the saves, RSVPs, and posts from people you follow show up here."
          }
        />
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold tracking-wide text-[var(--p-text-2)] uppercase">Scenes</h2>
          <Link
            href="/p/scenes"
            className="inline-flex items-center gap-1 text-xs font-medium text-[var(--p-accent-text)] hover:underline"
          >
            Browse all <ArrowRight size={12} aria-hidden="true" />
          </Link>
        </div>
        {scenes.length === 0 ? (
          <EmptyState
            title="No scenes yet"
            description="Scenes are the communities behind the nights — they’ll show up here as they publish."
          />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {scenes.slice(0, 6).map((s) => (
              <li key={s.id}>
                <Link
                  href={`/p/scenes/${s.slug}`}
                  className="surface hover-lift focus-ring flex flex-col gap-1 rounded-[var(--p-r-md)] p-4"
                >
                  <span className="font-semibold text-[var(--p-text-1)]">{s.name}</span>
                  {s.description && <span className="line-clamp-2 text-sm text-[var(--p-text-2)]">{s.description}</span>}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
