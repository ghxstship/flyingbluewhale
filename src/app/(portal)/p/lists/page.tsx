import Link from "next/link";
import { ArrowRight, Lock, Link2, Globe } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { hasSupabase } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { listLists } from "@/lib/gvteway";

export const dynamic = "force-dynamic";

/**
 * GVTEWAY · Lists — the viewer's shareable collections (design_handoff §2).
 * Reads `public.list` (owned + public/unlisted, scoped by RLS); detail + sharing
 * live at `/p/lists/[slug]`.
 */
const VIS_ICON = { private: Lock, unlisted: Link2, public: Globe } as const;

export default async function ListsPage() {
  const lists = hasSupabase ? await listLists(await createClient()) : [];

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-6 py-8">
      <header className="space-y-2">
        <p className="eyebrow eyebrow-accent">GVTEWAY</p>
        <h1>Lists</h1>
        <p className="text-[var(--p-text-2)]">Collections of events, scenes, and people, yours to share.</p>
      </header>

      {lists.length === 0 ? (
        <EmptyState
          title="No lists yet"
          description="Save events and scenes into a list, then share it with the people you’re bringing."
        />
      ) : (
        <ul className="space-y-2">
          {lists.map((l) => {
            const Icon = VIS_ICON[l.visibility as keyof typeof VIS_ICON] ?? Lock;
            return (
              <li key={l.id}>
                <Link
                  href={`/p/lists/${l.slug}`}
                  className="surface hover-lift focus-ring flex items-center justify-between gap-3 rounded-[var(--p-r-md)] p-4"
                >
                  <span className="flex items-center gap-2">
                    <Icon size={14} className="text-[var(--p-text-3)]" aria-hidden="true" />
                    <span className="font-semibold text-[var(--p-text-1)]">{l.name}</span>
                    <span className="font-mono text-[11px] text-[var(--p-text-3)] uppercase">{l.visibility}</span>
                  </span>
                  <ArrowRight size={14} className="text-[var(--p-text-3)]" aria-hidden="true" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
