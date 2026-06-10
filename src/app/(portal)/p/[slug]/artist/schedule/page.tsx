export const dynamic = "force-dynamic";

import { PortalSubpage } from "@/components/PortalSubpage";
import { EmptyState } from "@/components/ui/EmptyState";
import { createClient } from "@/lib/supabase/server";
import { projectIdFromSlug } from "@/lib/db/advancing";
import { fmtDateTime } from "@/components/detail/DetailShell";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getRequestT } from "@/lib/i18n/request";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { t } = await getRequestT();
  const project = await projectIdFromSlug(slug);
  let events: Array<{ id: string; name: string; starts_at: string; ends_at: string; event_state: string }> = [];
  if (project) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("events")
      .select("id, name, starts_at, ends_at, event_state")
      .eq("project_id", project.id)
      .order("starts_at", { ascending: true });
    events = (data ?? []) as typeof events;
  }
  return (
    <PortalSubpage
      slug={slug}
      persona="artist"
      title={t("p.artist.schedule.title", undefined, "Show Schedule")}
      subtitle={t("p.artist.schedule.subtitle", undefined, "Set times, load-in, sound-check")}
    >
      {events.length === 0 ? (
        <EmptyState
          title={t("p.artist.schedule.empty.title", undefined, "Awaiting Schedule")}
          description={t(
            "p.artist.schedule.empty.description",
            undefined,
            "Your schedule posts as soon as production confirms set times.",
          )}
        />
      ) : (
        <ul className="space-y-2">
          {events.map((e) => (
            <li key={e.id} className="surface p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">{e.name}</div>
                <StatusBadge status={e.event_state ?? "draft"} />
              </div>
              <div className="mt-1 font-mono text-xs text-[var(--p-text-2)]">
                {fmtDateTime(e.starts_at)} → {fmtDateTime(e.ends_at)}
              </div>
            </li>
          ))}
        </ul>
      )}
    </PortalSubpage>
  );
}
