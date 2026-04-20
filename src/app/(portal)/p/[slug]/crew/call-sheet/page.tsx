export const dynamic = "force-dynamic";

import { PortalSubpage } from "@/components/PortalSubpage";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/server";
import { projectIdFromSlug } from "@/lib/db/advancing";
import { fmtDateTime } from "@/components/detail/DetailShell";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await projectIdFromSlug(slug);
  type Event = { id: string; name: string; starts_at: string; location: { name: string; address: string | null } | null };
  let events: Event[] = [];
  if (project) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("events")
      .select("id, name, starts_at, location:locations(name, address)")
      .eq("project_id", project.id)
      .order("starts_at", { ascending: true })
      .limit(5);
    events = ((data ?? []) as unknown) as Event[];
  }
  return (
    <PortalSubpage slug={slug} persona="crew" title="Call sheet" subtitle="Day-of info, load-in, parking, contacts">
      {events.length === 0 ? (
        <EmptyState title="Awaiting call sheet" description="Production publishes the call sheet the day before each show." />
      ) : (
        <>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs text-[var(--text-muted)]">{events.length} upcoming call{events.length === 1 ? "" : "s"}</p>
            {project && <Button href={`/api/v1/projects/${project.id}/call-sheet`}>Download PDF</Button>}
          </div>
          <ul className="space-y-2">
            {events.map((e) => (
              <li key={e.id} className="surface p-4">
                <div className="text-sm font-semibold">{e.name}</div>
                <div className="mt-1 text-xs text-[var(--text-muted)] font-mono">{fmtDateTime(e.starts_at)}</div>
                {e.location && <div className="mt-1 text-xs">{e.location.name}{e.location.address ? ` · ${e.location.address}` : ""}</div>}
              </li>
            ))}
          </ul>
        </>
      )}
    </PortalSubpage>
  );
}
