export const dynamic = "force-dynamic";

import { PortalSubpage } from "@/components/PortalSubpage";
import { EmptyState } from "@/components/ui/EmptyState";
import { createClient } from "@/lib/supabase/server";
import { projectIdFromSlug } from "@/lib/db/advancing";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await projectIdFromSlug(slug);
  type Row = { id: string; name: string; address: string | null; city: string | null };
  const venues: Row[] = [];
  if (project) {
    const supabase = await createClient();
    // Two-step: get distinct location_ids from the project's events,
    // then hydrate the locations table. PostgREST doesn't infer the
    // FK between events.location_id and locations.id automatically.
    const { data: events } = await supabase
      .from("events")
      .select("location_id")
      .eq("project_id", project.id)
      .not("location_id", "is", null);
    const ids = Array.from(new Set((events ?? []).map((e) => e.location_id).filter((v): v is string => Boolean(v))));
    if (ids.length > 0) {
      const { data: locs } = await supabase
        .from("locations")
        .select("id, name, address, city")
        .in("id", ids);
      venues.push(...(locs ?? []) as Row[]);
    }
  }
  return (
    <PortalSubpage slug={slug} persona="artist" title="Venue" subtitle="Address, room setup, access, parking">
      {venues.length === 0 ? (
        <EmptyState title="Awaiting venue details" description="Venue info posts as soon as production locks the schedule." />
      ) : (
        <ul className="space-y-2">
          {venues.map((v) => (
            <li key={v.id} className="surface p-4">
              <div className="text-sm font-semibold">{v.name}</div>
              <div className="mt-1 text-xs text-[var(--text-muted)]">{v.address ?? "—"}{v.city ? ` · ${v.city}` : ""}</div>
            </li>
          ))}
        </ul>
      )}
    </PortalSubpage>
  );
}
