import Link from "next/link";
import { ActivityTimeline, type ActivityRow } from "@/components/gvteway/ActivityTimeline";
import { EmptyState } from "@/components/ui/EmptyState";
import { hasSupabase } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * GVTEWAY · Saved — events and scenes the viewer marked interested
 * (design_handoff §2). The viewer's own `public.activity` rows with
 * `verb='saved'` (RLS scopes to the actor). Session required.
 */
export default async function SavedPage() {
  const session = hasSupabase ? await getSession() : null;
  let saved: ActivityRow[] = [];
  if (session && hasSupabase) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("activity")
      .select("id, object_kind, object_ref, created_at")
      .eq("actor_id", session.userId)
      .eq("verb", "saved")
      .order("created_at", { ascending: false })
      .limit(60);
    saved = (data ?? []).map((r) => ({
      id: r.id,
      actorName: "You",
      verb: "saved" as const,
      objectLabel: r.object_ref || r.object_kind,
      at: r.created_at,
    }));
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-6 py-8">
      <header className="space-y-2">
        <p className="font-mono text-xs tracking-[0.14em] text-[var(--p-accent-text)] uppercase">GVTEWAY</p>
        <h1 className="text-3xl font-bold tracking-tight">Saved</h1>
      </header>

      {!session ? (
        <EmptyState
          title="Sign in to see your saves"
          description="Bookmark any event or scene and it lands here, yours to revisit or drop into a shareable list."
          action={
            <Link href="/login?next=/p/saved" className="font-medium text-[var(--p-accent-text)] hover:underline">
              Sign in
            </Link>
          }
        />
      ) : (
        <ActivityTimeline
          items={saved}
          emptyTitle="Nothing saved yet"
          emptyDescription="Tap the bookmark on any event or scene and it lands here, yours to revisit or drop into a shareable list."
        />
      )}
    </div>
  );
}
