import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, Users, MapPin, Disc3 } from "lucide-react";
import { ShareSheet } from "@/components/gvteway/ShareSheet";
import { EmptyState } from "@/components/ui/EmptyState";
import { hasSupabase } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { getListBySlug } from "@/lib/gvteway";
import { urlFor } from "@/lib/urls";

export const dynamic = "force-dynamic";

/**
 * GVTEWAY · List detail — a shareable collection (design_handoff §2). Keyed by
 * `public.list.slug`; items read from `public.list_item`. The `<ShareSheet>` is
 * the handoff surface (copy / OS share), its URL built with `urlFor`.
 */
const ITEM_ICON = { event: Calendar, scene: Disc3, user: Users, venue: MapPin } as const;

export default async function ListDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!hasSupabase) notFound();
  const loaded = await getListBySlug(await createClient(), slug);
  if (!loaded) notFound();
  const { list, items } = loaded;
  const shareUrl = urlFor("portal", `/lists/${slug}`);

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-6 py-8">
      <Link
        href="/p/lists"
        className="inline-flex items-center gap-1 text-xs font-medium text-[var(--p-text-2)] hover:text-[var(--p-text-1)]"
      >
        <ArrowLeft size={12} aria-hidden="true" /> All lists
      </Link>

      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-2">
          <p className="font-mono text-xs tracking-[0.14em] text-[var(--p-accent-text)] uppercase">
            GVTEWAY · List · {list.visibility}
          </p>
          <h1 className="text-3xl font-bold tracking-tight">{list.name}</h1>
        </div>
        {list.visibility !== "private" && <ShareSheet url={shareUrl} title={list.name} />}
      </header>

      {items.length === 0 ? (
        <EmptyState
          title="This list is empty"
          description="Add events and scenes from anywhere in GVTEWAY, then share the link with your crew."
        />
      ) : (
        <ul className="space-y-2">
          {items.map((it) => {
            const Icon = ITEM_ICON[it.itemKind as keyof typeof ITEM_ICON] ?? Calendar;
            return (
              <li key={it.id} className="surface flex items-center gap-3 rounded-[var(--p-r-md)] p-3">
                <Icon size={15} className="shrink-0 text-[var(--p-accent)]" aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate text-sm text-[var(--p-text-1)]">{it.itemRef}</span>
                <span className="font-mono text-[11px] text-[var(--p-text-3)] uppercase">{it.itemKind}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
