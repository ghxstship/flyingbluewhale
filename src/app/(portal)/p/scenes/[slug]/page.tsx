import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { SceneDetailTabs } from "@/components/gvteway/SceneDetailTabs";
import { Avatar } from "@/components/ui/Avatar";
import { hasSupabase } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { getRequestFormatters } from "@/lib/i18n/request";
import { getSceneBySlug, listScenePosts, listSceneMembers, getSceneEvents } from "@/lib/gvteway";

export const dynamic = "force-dynamic";

function relativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.floor(ms / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  return `${Math.floor(hr / 24)}d`;
}

/**
 * GVTEWAY · Scene detail — feed · events · members (design_handoff §2). Keyed by
 * `public.scene.slug`. Feed reads `public.post`, members read
 * `public.scene_member` (names resolved from `user_profiles`). Events stay
 * firstRun — scenes aren't yet linked to a project's `set_time`.
 */
export default async function SceneDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!hasSupabase) notFound();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();

  const scene = await getSceneBySlug(supabase, slug);
  if (!scene) notFound();

  const [posts, members, sceneEvents] = await Promise.all([
    listScenePosts(supabase, scene.id),
    listSceneMembers(supabase, scene.id),
    getSceneEvents(supabase, scene.id),
  ]);

  const feed =
    posts.length > 0 ? (
      <ol className="space-y-2">
        {posts.map((p) => (
          <li key={p.id} className="surface rounded-[var(--p-r-md)] p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-[var(--p-text-1)]">{p.authorName}</span>
              <span className="font-mono text-[11px] text-[var(--p-text-3)]">{relativeTime(p.at)}</span>
            </div>
            <p className="mt-1 text-sm text-[var(--p-text-2)]">{p.body}</p>
          </li>
        ))}
      </ol>
    ) : undefined;

  const memberList =
    members.length > 0 ? (
      <ul className="space-y-2">
        {members.map((m) => (
          <li key={m.userId} className="surface flex items-center gap-3 rounded-[var(--p-r-md)] p-3">
            <Avatar size="sm" name={m.name} />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-[var(--p-text-1)]">{m.name}</p>
              {m.handle && <p className="truncate font-mono text-[11px] text-[var(--p-text-3)]">@{m.handle}</p>}
            </div>
            {m.role !== "member" && (
              <span className="ms-auto text-[11px] font-medium text-[var(--p-accent-text)] uppercase">{m.role}</span>
            )}
          </li>
        ))}
      </ul>
    ) : undefined;

  const events =
    sceneEvents.length > 0 ? (
      <ul className="space-y-2">
        {sceneEvents.map((e) => (
          <li key={e.projectId}>
            <Link
              href={`/p/${e.slug}`}
              className="surface hover-lift focus-ring flex items-center justify-between gap-3 rounded-[var(--p-r-md)] p-3"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-[var(--p-text-1)]">{e.name}</span>
                {e.startDate && (
                  <span className="block font-mono text-[11px] text-[var(--p-text-3)]">
                    {fmt.dateParts(new Date(e.startDate), { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                )}
              </span>
              <ArrowLeft size={14} className="rotate-180 text-[var(--p-text-3)]" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    ) : undefined;

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-6 py-8">
      <Link
        href="/p/scenes"
        className="inline-flex items-center gap-1 text-xs font-medium text-[var(--p-text-2)] hover:text-[var(--p-text-1)]"
      >
        <ArrowLeft size={12} aria-hidden="true" /> All scenes
      </Link>

      <header className="space-y-2">
        <p className="font-mono text-xs tracking-[0.14em] text-[var(--p-accent-text)] uppercase">GVTEWAY · Scene</p>
        <h1 className="text-3xl font-bold tracking-tight">{scene.name}</h1>
        {scene.description && <p className="text-[var(--p-text-2)]">{scene.description}</p>}
      </header>

      <SceneDetailTabs feed={feed} events={events} members={memberList} />
    </div>
  );
}
