export const dynamic = "force-dynamic";

import { PortalSubpage } from "@/components/PortalSubpage";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/server";
import { projectIdFromSlug } from "@/lib/db/advancing";
import { fmtDateTime } from "@/components/detail/DetailShell";
import { getRequestT } from "@/lib/i18n/request";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { t } = await getRequestT();
  const project = await projectIdFromSlug(slug);
  type Event = {
    id: string;
    name: string;
    starts_at: string;
    location: { name: string; address: string | null } | null;
  };
  let events: Event[] = [];
  if (project) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("events")
      .select("id, name, starts_at, location:locations(name, address)")
      .eq("project_id", project.id)
      .order("starts_at", { ascending: true })
      .limit(5);
    events = (data ?? []) as unknown as Event[];
  }
  return (
    <PortalSubpage
      slug={slug}
      persona="crew"
      title={t("p.crew.call-sheet.title", undefined, "Call Sheet")}
      subtitle={t("p.crew.call-sheet.subtitle", undefined, "Day-of info, load-in, parking, contacts")}
    >
      {events.length === 0 ? (
        <EmptyState
          title={t("p.crew.call-sheet.empty.title", undefined, "Awaiting Call Sheet")}
          description={t(
            "p.crew.call-sheet.empty.description",
            undefined,
            "Production publishes the call sheet the day before each show.",
          )}
        />
      ) : (
        <>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs text-[var(--p-text-2)]">
              {events.length === 1
                ? t("p.crew.call-sheet.upcomingOne", { count: events.length }, `${events.length} upcoming call`)
                : t("p.crew.call-sheet.upcomingMany", { count: events.length }, `${events.length} upcoming calls`)}
            </p>
            {project && (
              <Button href={`/api/v1/projects/${project.id}/call-sheet`}>
                {t("p.crew.call-sheet.downloadPdf", undefined, "Download PDF")}
              </Button>
            )}
          </div>
          <ul className="space-y-2">
            {events.map((e) => (
              <li key={e.id} className="surface p-4">
                <div className="text-sm font-semibold">{e.name}</div>
                <div className="mt-1 font-mono text-xs text-[var(--p-text-2)]">{fmtDateTime(e.starts_at)}</div>
                {e.location && (
                  <div className="mt-1 text-xs">
                    {e.location.name}
                    {e.location.address ? ` · ${e.location.address}` : ""}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </PortalSubpage>
  );
}
