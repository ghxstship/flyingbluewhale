export const dynamic = "force-dynamic";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";

type Snapshot = {
  id: string;
  label: string;
  body: string | null;
  photo_url: string | null;
  pinned_at: string;
  project_id: string;
};

type Project = { id: string; name: string };

export default async function MobileSnapshotsPage() {
  if (!hasSupabase) {
    return <div className="px-4 pt-6 pb-24 text-sm text-[var(--color-text-muted)]">Configure Supabase.</div>;
  }

  const session = await requireSession();
  const supabase = (await createClient()) as unknown as LooseSupabase;

  const [{ data: rawSnaps }, { data: rawProjects }] = await Promise.all([
    supabase
      .from("event_snapshots")
      .select("id, label, body, photo_url, pinned_at, project_id")
      .eq("user_id", session.userId)
      .order("pinned_at", { ascending: false })
      .limit(50),
    supabase
      .from("projects")
      .select("id, name")
      .eq("org_id", session.orgId)
      .is("deleted_at", null),
  ]);

  const snaps = (rawSnaps ?? []) as Snapshot[];
  const projects = new Map(((rawProjects ?? []) as Project[]).map((p) => [p.id, p.name]));

  return (
    <div className="px-4 pt-6 pb-24">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-lg font-semibold">Snapshots</h1>
        <Button href="/m/snapshot/new" size="sm" variant="primary">
          + New
        </Button>
      </div>

      {snaps.length === 0 ? (
        <EmptyState
          title="No snapshots yet"
          description="Bookmark key moments during a live event so they appear in the post-event debrief."
          action={
            <Button href="/m/snapshot/new" variant="primary">
              Capture a moment
            </Button>
          }
        />
      ) : (
        <ul className="space-y-3">
          {snaps.map((snap) => (
            <li key={snap.id} className="surface-raised p-4 rounded-xl">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{snap.label}</p>
                  {snap.body && (
                    <p className="text-xs text-[var(--color-text-muted)] mt-0.5 line-clamp-2">{snap.body}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2 text-xs text-[var(--color-text-muted)]">
                    <span>{projects.get(snap.project_id) ?? "Project"}</span>
                    <span>·</span>
                    <span>
                      {new Date(snap.pinned_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
                {snap.photo_url && (
                  <img
                    src={snap.photo_url}
                    alt=""
                    className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                  />
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
