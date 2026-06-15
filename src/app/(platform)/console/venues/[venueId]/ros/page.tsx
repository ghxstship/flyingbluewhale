import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";

export const dynamic = "force-dynamic";

type VenueRow = { id: string; name: string; location_id: string | null };

type CueRow = {
  id: string;
  scheduled_at: string;
  lane: string;
  label: string;
  description: string | null;
  status: string;
  duration_seconds: number | null;
  event: { id: string; name: string; location_id: string | null } | null;
};

const STATUS_TONE: Record<string, "muted" | "warning" | "info" | "success" | "error"> = {
  pending: "muted",
  standby: "warning",
  live: "error",
  done: "success",
  cancelled: "muted",
};

export default async function Page({ params }: { params: Promise<{ venueId: string }> }) {
  const { venueId } = await params;
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.venues.ros.eyebrow", undefined, "Venue")}
          title={t("console.venues.ros.title", undefined, "Run of Show")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.venues.ros.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const fmt = await getRequestFormatters();

  function fmtDuration(s: number | null): string {
    if (s == null) return "";
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    const r = s % 60;
    return r === 0 ? `${m}m` : `${m}m ${r}s`;
  }
  const fmtTime = (iso: string): string => fmt.time(iso);
  const fmtDay = (iso: string): string => fmt.dateParts(iso, { weekday: "short", month: "short", day: "numeric" });
  const { data: venueData } = await supabase
    .from("venues")
    .select("id, name, location_id")
    .eq("id", venueId)
    .eq("org_id", session.orgId)
    .maybeSingle();
  const venue = venueData as VenueRow | null;
  if (!venue) notFound();

  const { data: cueData } = await supabase
    .from("cues")
    .select(
      "id, scheduled_at, lane, label, description, status:cue_state, duration_seconds, event:event_id(id, name, location_id)",
    )
    .eq("org_id", session.orgId)
    .order("scheduled_at", { ascending: true })
    .limit(500);
  const allCues = (cueData ?? []) as unknown as CueRow[];
  // Restrict to cues whose event takes place at this venue's location.
  const cues = venue.location_id ? allCues.filter((c) => c.event?.location_id === venue.location_id) : allCues;

  // Group by date
  const byDay = new Map<string, CueRow[]>();
  for (const c of cues) {
    const day = c.scheduled_at.slice(0, 10);
    const arr = byDay.get(day) ?? [];
    arr.push(c);
    byDay.set(day, arr);
  }
  const days = Array.from(byDay.keys()).sort();

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.venues.ros.eyebrow", undefined, "Venue")}
        title={`${venue.name} — ${t("console.venues.ros.title", undefined, "Run of Show")}`}
        subtitle={`${cues.length} ${cues.length === 1 ? t("console.venues.ros.cueSingular", undefined, "cue") : t("console.venues.ros.cuePlural", undefined, "cues")} ${t("console.venues.ros.across", undefined, "across")} ${days.length} ${days.length === 1 ? t("console.venues.ros.daySingular", undefined, "day") : t("console.venues.ros.dayPlural", undefined, "days")}`}
        breadcrumbs={[
          { label: t("console.venues.ros.breadcrumbVenues", undefined, "Venues"), href: "/console/venues" },
          { label: venue.name, href: `/console/venues/${venue.id}` },
          { label: t("console.venues.ros.title", undefined, "Run of Show") },
        ]}
      />
      <div className="page-content space-y-5">
        {cues.length === 0 ? (
          <div className="surface p-6 text-sm text-[var(--p-text-2)]">
            {t("console.venues.ros.emptyPrefix", undefined, "No cues scheduled at this venue yet. Authoring lives in")}{" "}
            <code>/console/production/ros</code>.
          </div>
        ) : (
          <div className="space-y-6">
            {days.map((day) => (
              <section key={day}>
                <h3 className="text-xs font-semibold tracking-wider text-[var(--p-text-2)] uppercase">{fmtDay(day)}</h3>
                <ul className="mt-3 divide-y divide-[var(--p-border)]">
                  {(byDay.get(day) ?? []).map((c) => (
                    <li key={c.id} className="flex items-start gap-3 py-2">
                      <div className="w-14 shrink-0 font-mono text-xs tabular-nums">{fmtTime(c.scheduled_at)}</div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="text-sm font-medium">{c.label}</div>
                            <div className="font-mono text-[10px] text-[var(--p-text-2)]">
                              {c.lane}
                              {c.duration_seconds ? ` · ${fmtDuration(c.duration_seconds)}` : ""}
                              {c.event?.name ? ` · ${c.event.name}` : ""}
                            </div>
                          </div>
                          <Badge variant={STATUS_TONE[c.status] ?? "muted"}>{toTitle(c.status)}</Badge>
                        </div>
                        {c.description && <p className="mt-1 text-xs text-[var(--p-text-2)]">{c.description}</p>}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}

        <p className="text-xs text-[var(--p-text-2)]">
          {t(
            "console.venues.ros.footnote",
            undefined,
            "Cues authored on the production ROS page appear here automatically for this venue.",
          )}
        </p>
      </div>
    </>
  );
}
