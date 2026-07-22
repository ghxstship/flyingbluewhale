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
  type Sheet = {
    id: string;
    city: string | null;
    venue: string | null;
    sheet_date: string | null;
    crew_call: string | null;
    doors: string | null;
    headline_set: string | null;
    curfew: string | null;
    sheet_state: string;
  };
  let events: Event[] = [];
  let sheets: Sheet[] = [];
  if (project) {
    const supabase = await createClient();
    const [{ data }, { data: sheetData }] = await Promise.all([
      supabase
        .from("events")
        .select("id, name, starts_at, location:locations(name, address)")
        .eq("project_id", project.id)
        .order("starts_at", { ascending: true })
        .limit(5),
      // Published day sheets for this date (kit 26): the operator-composed
      // one-page show day, pushed to the field. Drafts never reach the portal.
      supabase
        .from("day_sheets")
        .select("id, city, venue, sheet_date, crew_call, doors, headline_set, curfew, sheet_state")
        .eq("project_id", project.id)
        .in("sheet_state", ["published", "updated"])
        .is("deleted_at", null)
        .order("sheet_date", { ascending: true })
        .limit(5),
    ]);
    events = (data ?? []) as unknown as Event[];
    sheets = (sheetData ?? []) as Sheet[];
  }
  const hhmm = (v: string | null) => (v ? v.slice(0, 5) : "—");
  return (
    <PortalSubpage
      slug={slug}
      persona="crew"
      title={t("p.crew.call-sheet.title", undefined, "Call Sheet")}
      subtitle={t("p.crew.call-sheet.subtitle", undefined, "Day-of info, load-in, parking, contacts")}
    >
      {sheets.length > 0 && (
        <div className="mb-5">
          <p className="eyebrow mb-2">
            {t("p.crew.call-sheet.daySheets", undefined, "Day Sheets")}
          </p>
          <ul className="space-y-2">
            {sheets.map((s) => (
              <li key={s.id} className="surface p-4">
                <div className="flex items-baseline justify-between gap-3">
                  <div className="text-sm font-semibold">
                    {[s.city, s.venue].filter(Boolean).join(" · ") ||
                      t("p.crew.call-sheet.daySheetFallback", undefined, "Show Day")}
                  </div>
                  <div className="font-mono text-xs text-[var(--p-text-2)]">
                    {s.sheet_state === "updated" ? `${t("p.crew.call-sheet.updated", undefined, "Updated")} · ` : ""}
                    {s.sheet_date ?? ""}
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-4 gap-2 text-xs">
                  {(
                    [
                      [t("p.crew.call-sheet.crewCall", undefined, "Crew Call"), hhmm(s.crew_call)],
                      [t("p.crew.call-sheet.doors", undefined, "Doors"), hhmm(s.doors)],
                      [t("p.crew.call-sheet.set", undefined, "Set"), s.headline_set ?? "—"],
                      [t("p.crew.call-sheet.curfew", undefined, "Curfew"), hhmm(s.curfew)],
                    ] as Array<[string, string]>
                  ).map(([label, value]) => (
                    <div key={label} className="min-w-0">
                      <div className="eyebrow">{label}</div>
                      <div className="truncate font-mono tabular-nums">{value}</div>
                    </div>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
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
