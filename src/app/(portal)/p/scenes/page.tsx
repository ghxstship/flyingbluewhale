import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { hasSupabase } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { listPublishedScenes } from "@/lib/gvteway";

export const dynamic = "force-dynamic";

/**
 * GVTEWAY · Scenes — the directory of communities (design_handoff §2). Root-level
 * consumer surface. Lists published `public.scene` rows (anon-readable via RLS);
 * detail lives at `/p/scenes/[slug]`.
 */
export default async function ScenesPage() {
  const scenes = hasSupabase ? await listPublishedScenes(await createClient()) : [];

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-6 py-8">
      <header className="space-y-2">
        <p className="font-mono text-xs tracking-[0.14em] text-[var(--p-accent-text)] uppercase">GVTEWAY</p>
        <h1 className="text-3xl font-bold tracking-tight">Scenes</h1>
        <p className="text-[var(--p-text-2)]">The communities behind the nights. Find yours.</p>
      </header>

      {scenes.length === 0 ? (
        <EmptyState
          title="Scenes are warming up"
          description="Published scenes will list here. Follow one and its feed lands in Community."
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {scenes.map((s) => (
            <li key={s.id}>
              <Link
                href={`/p/scenes/${s.slug}`}
                className="surface hover-lift focus-ring flex flex-col gap-1 rounded-[var(--p-r-md)] p-4"
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-[var(--p-text-1)]">{s.name}</span>
                  <ArrowRight size={14} className="text-[var(--p-text-3)]" aria-hidden="true" />
                </span>
                {s.description && <span className="line-clamp-2 text-sm text-[var(--p-text-2)]">{s.description}</span>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
