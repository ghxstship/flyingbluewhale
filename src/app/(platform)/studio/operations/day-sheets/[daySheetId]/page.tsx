import Link from "next/link";
import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { scheduleKindLabel } from "@/lib/schedule/kinds";
import { DAY_SHEET_STATE_LABELS, DAY_SHEET_STATE_TONE, type DaySheetState } from "@/lib/db/day-sheets";
import { DaySheetPublishBar } from "./DaySheetPublishBar";
import { DaySheetPrintButton } from "./DaySheetPrintButton";

export const dynamic = "force-dynamic";

type Sheet = {
  id: string;
  city: string | null;
  venue: string | null;
  sheet_date: string | null;
  crew_call: string | null;
  doors: string | null;
  headline_set: string | null;
  curfew: string | null;
  sheet_state: DaySheetState;
  published_at: string | null;
  tour_id: string | null;
  project_id: string | null;
  tour: { name: string } | null;
  project: { name: string } | null;
};

type Activity = { id: string; name: string; event_kind: string; starts_at: string; ends_at: string };

function timeOf(iso: string): string {
  // Render HH:MM in the stored zone without pulling a formatter into the page.
  const m = /T(\d{2}:\d{2})/.exec(iso);
  return m?.[1] ?? iso;
}

export default async function Page({ params }: { params: Promise<{ daySheetId: string }> }) {
  const { daySheetId } = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const supabase = await createClient();
  const { t } = await getRequestT();

  const { data } = await supabase
    .from("day_sheets")
    .select(
      "id, city, venue, sheet_date, crew_call, doors, headline_set, curfew, sheet_state, published_at, tour_id, project_id, tour:tours(name), project:projects(name)",
    )
    .eq("id", daySheetId)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!data) return notFound();
  const sheet = data as unknown as Sheet;

  // Compose the run-of-show from the canonical schedule store by project_id —
  // referenced, not copied (SSOT). Only when the sheet is bound to a date.
  let activities: Activity[] = [];
  if (sheet.project_id) {
    const { data: acts } = await supabase
      .from("events")
      .select("id, name, event_kind, starts_at, ends_at")
      .eq("org_id", session.orgId)
      .eq("project_id", sheet.project_id)
      .order("starts_at", { ascending: true })
      .limit(100);
    activities = (acts ?? []) as Activity[];
  }

  const header: Array<[string, string | null]> = [
    [t("console.daySheets.detail.crewCall", undefined, "Crew Call"), sheet.crew_call],
    [t("console.daySheets.detail.doors", undefined, "Doors"), sheet.doors],
    [t("console.daySheets.detail.set", undefined, "Headline Set"), sheet.headline_set],
    [t("console.daySheets.detail.curfew", undefined, "Curfew"), sheet.curfew],
  ];

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.daySheets.eyebrow", undefined, "Operations")}
        title={sheet.city ?? t("console.daySheets.detail.untitled", undefined, "Day Sheet")}
        subtitle={[sheet.venue, sheet.sheet_date].filter(Boolean).join(" · ") || undefined}
        action={
          <div className="flex items-center gap-2">
            <DaySheetPrintButton />
            <DaySheetPublishBar daySheetId={sheet.id} state={sheet.sheet_state} />
          </div>
        }
      />
      <div className="page-content space-y-5">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant={DAY_SHEET_STATE_TONE[sheet.sheet_state]}>{DAY_SHEET_STATE_LABELS[sheet.sheet_state]}</Badge>
          {sheet.tour_id && sheet.tour && (
            <Link href={`/studio/agency/tours/${sheet.tour_id}`} className="text-xs text-[color:var(--p-accent)] hover:underline">
              {sheet.tour.name}
            </Link>
          )}
          {sheet.project_id && sheet.project && (
            <Link
              href={`/studio/projects/${sheet.project_id}`}
              className="text-xs text-[var(--p-text-2)] hover:text-[var(--p-text-1)] hover:underline"
            >
              {sheet.project.name}
            </Link>
          )}
        </div>

        <div className="metric-grid-4">
          {header.map(([label, value]) => (
            <div key={label} className="surface p-4">
              <div className="text-xs text-[var(--p-text-2)]">{label}</div>
              <div className="mt-1 font-mono text-lg tabular-nums">{value ?? "—"}</div>
            </div>
          ))}
        </div>

        <section className="surface p-5">
          <h2 className="ps-eyebrow mb-3">{t("console.daySheets.detail.runOfShow", undefined, "Run Of Show")}</h2>
          {activities.length === 0 ? (
            <p className="text-sm text-[var(--p-text-2)]">
              {sheet.project_id
                ? t("console.daySheets.detail.noActivities", undefined, "No schedule activities for this date yet.")
                : t(
                    "console.daySheets.detail.bindProject",
                    undefined,
                    "Bind this sheet to a date to compose its run-of-show from the schedule.",
                  )}
            </p>
          ) : (
            <ul className="divide-y divide-[var(--p-border)]">
              {activities.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-4 py-2">
                  <div className="flex items-center gap-3">
                    <span className="w-16 font-mono text-xs tabular-nums text-[var(--p-text-2)]">{timeOf(a.starts_at)}</span>
                    <span className="text-sm">{a.name}</span>
                  </div>
                  <Badge variant="muted">{scheduleKindLabel(a.event_kind)}</Badge>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
