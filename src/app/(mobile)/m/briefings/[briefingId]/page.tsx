import { notFound } from "next/navigation";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { urlFor } from "@/lib/urls";
import { BriefingSignIn, type AttendeeRow, type CrewOption } from "./BriefingSignIn";

/**
 * COMPVSS · Safety Briefing detail — the field half of the toolbox talk.
 *
 * The deliverer (manager band) starts the talk and shows the QR; crew land
 * here — by scanning it or from /m/briefings — and sign in with a real
 * signature. The console's attendance roll reads the same rows.
 */
export const dynamic = "force-dynamic";

type BriefingRecord = {
  id: string;
  topic: string;
  briefing_state: string;
  scheduled_for: string;
  conducted_at: string | null;
  notes: string | null;
  briefer: { name: string | null; email: string | null } | null;
  project: { name: string | null } | null;
};

type AttendeeRecord = {
  id: string;
  acknowledged_at: string | null;
  signature_path: string | null;
  user_id: string | null;
  crew_member_id: string | null;
  user: { name: string | null; email: string | null } | null;
  crew: { name: string | null } | null;
};

export default async function BriefingDetailPage({ params }: { params: Promise<{ briefingId: string }> }) {
  const { briefingId } = await params;
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return <div className="screen">{t("m.briefings.configureSupabase", undefined, "Configure Supabase.")}</div>;
  }
  const session = await requireSession();
  const fmt = await getRequestFormatters();
  const supabase = await createClient();

  const { data } = await supabase
    .from("safety_briefings")
    .select(
      "id, topic, briefing_state, scheduled_for, conducted_at, notes, briefer:briefer_id(name, email), project:project_id(name)",
    )
    .eq("id", briefingId)
    .eq("org_id", session.orgId)
    .maybeSingle();
  const briefing = data as unknown as BriefingRecord | null;
  if (!briefing) notFound();

  const [{ data: attendeesData }, { data: crewData }] = await Promise.all([
    supabase
      .from("safety_briefing_attendees")
      .select(
        "id, acknowledged_at, signature_path, user_id, crew_member_id, user:users!safety_briefing_attendees_user_id_fkey(name, email), crew:crew_members!safety_briefing_attendees_crew_member_id_fkey(name)",
      )
      .eq("briefing_id", briefingId)
      .eq("org_id", session.orgId)
      .order("acknowledged_at", { ascending: true, nullsFirst: true }),
    supabase.from("crew_members").select("id, name").eq("org_id", session.orgId).order("name", { ascending: true }),
  ]);

  const attendeeRecords = (attendeesData ?? []) as unknown as AttendeeRecord[];
  const attendees: AttendeeRow[] = attendeeRecords.map((a) => ({
    id: a.id,
    name: a.user?.name ?? a.user?.email ?? a.crew?.name ?? t("m.briefings.unknown", undefined, "Unknown"),
    signed: Boolean(a.acknowledged_at),
    signedAtLabel: a.acknowledged_at ? fmt.time(a.acknowledged_at) : null,
    hasSignature: Boolean(a.signature_path),
  }));

  const mine = attendeeRecords.find((a) => a.user_id === session.userId);
  // Roster names already signed drop out of the pick list — signing twice
  // is a replay, not a second attendance.
  const signedCrewIds = new Set(attendeeRecords.filter((a) => a.acknowledged_at && a.crew_member_id).map((a) => a.crew_member_id));
  const crewOptions: CrewOption[] = ((crewData ?? []) as { id: string; name: string | null }[])
    .filter((c) => !signedCrewIds.has(c.id))
    .map((c) => ({ id: c.id, name: c.name ?? c.id.slice(0, 8) }));

  return (
    <BriefingSignIn
      briefingId={briefing.id}
      topic={briefing.topic}
      state={briefing.briefing_state}
      scheduledLabel={fmt.dateTime(briefing.scheduled_for)}
      conductedLabel={briefing.conducted_at ? fmt.time(briefing.conducted_at) : null}
      projectName={briefing.project?.name ?? null}
      brieferName={briefing.briefer?.name ?? briefing.briefer?.email ?? null}
      briefingNotes={briefing.notes}
      isDeliverer={isManagerPlus(session)}
      // The QR the deliverer holds up: an absolute URL so any camera app
      // lands the scanner exactly here.
      qrValue={urlFor("mobile", `/briefings/${briefing.id}`)}
      meSigned={Boolean(mine?.acknowledged_at)}
      attendees={attendees}
      crewOptions={crewOptions}
    />
  );
}
