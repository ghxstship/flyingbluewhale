export const dynamic = "force-dynamic";

import { PortalSubpage } from "@/components/PortalSubpage";
import { EmptyState } from "@/components/ui/EmptyState";
import { createClient } from "@/lib/supabase/server";
import { projectIdFromSlug } from "@/lib/db/advancing";
import { fmtDateTime } from "@/components/detail/DetailShell";
import { StatusBadge } from "@/components/ui/StatusBadge";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await projectIdFromSlug(slug);
  let events: Array<{ id: string; name: string; starts_at: string; ends_at: string; status: string }> = [];
  if (project) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("events")
      .select("id, name, starts_at, ends_at, status")
      .eq("project_id", project.id)
      .order("starts_at", { ascending: true });
    events = (data ?? []) as typeof events;
  }
  return (
    <PortalSubpage slug={slug} persona="artist" title="Show schedule" subtitle="Set times, load-in, sound-check">
      {events.length === 0 ? (
        <EmptyState title="Awaiting schedule" description="Your schedule posts as soon as production confirms set times." />
      ) : (
        <ul className="space-y-2">
          {events.map((e) => (
            <li key={e.id} className="surface p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">{e.name}</div>
                <StatusBadge status={e.status ?? "draft"} />
              </div>
              <div className="mt-1 text-xs text-[var(--text-muted)] font-mono">{fmtDateTime(e.starts_at)} → {fmtDateTime(e.ends_at)}</div>
            </li>
          ))}
        </ul>
      )}
    </PortalSubpage>
  );
}
