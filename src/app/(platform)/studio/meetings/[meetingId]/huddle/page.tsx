import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession, isManagerPlus } from "@/lib/auth";
import { getRequestFormatters } from "@/lib/i18n/request";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase, hasVideoProvider } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { toneFor } from "@/lib/tones";
import {
  VIDEO_CALL_STATE_LABELS,
  VIDEO_PARTICIPANT_ROLE_LABELS,
  isPresent,
  presentCount,
  type VideoCall,
  type VideoCallState,
  type VideoParticipantRole,
} from "@/lib/video";
import { HuddleControls } from "./HuddleControls";

export const dynamic = "force-dynamic";

type RosterRow = {
  id: string;
  user_id: string;
  role: VideoParticipantRole;
  joined_at: string | null;
  left_at: string | null;
  user: { name: string | null; email: string; avatar_url: string | null } | null;
};

export default async function Page({ params }: { params: Promise<{ meetingId: string }> }) {
  const { meetingId } = await params;

  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Operations · Run" title="Huddle" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }

  const session = await requireSession();
  const fmt = await getRequestFormatters();
  const canManage = isManagerPlus(session);
  const supabase = (await createClient()) as unknown as LooseSupabase;

  const { data: meeting } = await supabase
    .from("events")
    .select("id, name")
    .eq("id", meetingId)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!meeting) notFound();
  const meetingTitle = (meeting as { name?: string }).name ?? meetingId;

  const { data: callData } = await supabase
    .from("video_calls")
    .select("id, org_id, meeting_id, title, room_name, call_state, started_at, ended_at, created_by, created_at")
    .eq("org_id", session.orgId)
    .eq("meeting_id", meetingId)
    .is("deleted_at", null)
    .maybeSingle();
  const call = (callData ?? null) as VideoCall | null;

  let roster: RosterRow[] = [];
  if (call) {
    const { data: rows } = await supabase
      .from("video_call_participants")
      .select("id, user_id, role, joined_at, left_at, user:user_id(name, email, avatar_url)")
      .eq("org_id", session.orgId)
      .eq("call_id", call.id)
      .is("deleted_at", null)
      .order("joined_at", { ascending: true });
    roster = (rows ?? []) as unknown as RosterRow[];
  }

  const present = roster.filter((r) => isPresent(r));
  const me = roster.find((r) => r.user_id === session.userId);
  const iAmPresent = me ? isPresent(me) : false;
  const callState: VideoCallState | null = call?.call_state ?? null;

  return (
    <>
      <ModuleHeader
        eyebrow="Operations · Run"
        title={`Huddle · ${meetingTitle}`}
        subtitle={
          call
            ? `${presentCount(roster)} in the room · ${roster.length} ${roster.length === 1 ? "participant" : "participants"}`
            : "No huddle started for this meeting yet"
        }
        action={
          <div className="flex items-center gap-2">
            <Button href={`/studio/meetings/${meetingId}`} variant="ghost" size="sm">
              Back
            </Button>
            {call && <Badge variant={toneFor(call.call_state)}>{VIDEO_CALL_STATE_LABELS[call.call_state]}</Badge>}
          </div>
        }
      />

      <div className="page-content space-y-5">
        {!hasVideoProvider && (
          <div className="surface-inset flex flex-col gap-1 p-5 text-sm">
            <p className="font-medium text-[var(--p-text-1)]">No video provider configured</p>
            <p className="text-xs text-[var(--p-text-2)]">
              Configure a video provider (set VIDEO_PROVIDER_URL + VIDEO_PROVIDER_KEY) to enable live media. The huddle
              room, roster, and join/leave presence all work without it. Live audio/video activates the moment a
              provider is wired.
            </p>
          </div>
        )}

        {!call ? (
          <EmptyState
            title="No huddle yet"
            description={
              canManage
                ? "Start a huddle to open a room for this meeting and let attendees join."
                : "A manager hasn't opened a huddle for this meeting yet."
            }
            action={canManage ? <HuddleControls kind="ensure" meetingId={meetingId} /> : undefined}
          />
        ) : (
          <>
            {/* Participant grid */}
            {present.length === 0 ? (
              <EmptyState
                size="compact"
                title="The room is empty"
                description="No one has joined yet. Be the first to hop in."
              />
            ) : (
              <div className="metric-grid">
                {present.map((p) => {
                  const name = p.user?.name ?? p.user?.email ?? "Member";
                  return (
                    <div key={p.id} className="surface flex flex-col items-center justify-center gap-2 p-6 text-center">
                      <Avatar name={name} src={p.user?.avatar_url} size="xl" presence="online" />
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-medium text-[var(--p-text-1)]">{name}</span>
                        <span className="text-[11px] tracking-wide text-[var(--p-text-2)] uppercase">
                          {VIDEO_PARTICIPANT_ROLE_LABELS[p.role]}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Join / leave + lifecycle controls */}
            <div className="surface flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="text-xs text-[var(--p-text-2)]">
                Room <span className="font-mono">{call.room_name}</span>
              </div>
              <HuddleControls
                kind="member"
                meetingId={meetingId}
                callId={call.id}
                callState={callState!}
                iAmPresent={iAmPresent}
                canManage={canManage}
              />
            </div>

            {/* Full roster */}
            <div className="surface overflow-hidden">
              <table className="data-table w-full">
                <thead>
                  <tr>
                    <th>Participant</th>
                    <th>Role</th>
                    <th>Joined</th>
                    <th>Left</th>
                  </tr>
                </thead>
                <tbody>
                  {roster.map((p) => {
                    const name = p.user?.name ?? p.user?.email ?? "Member";
                    return (
                      <tr key={p.id}>
                        <td className="flex items-center gap-2">
                          <Avatar name={name} src={p.user?.avatar_url} size="sm" />
                          <span className="text-sm">{name}</span>
                        </td>
                        <td className="text-xs">{VIDEO_PARTICIPANT_ROLE_LABELS[p.role]}</td>
                        <td className="font-mono text-xs">
                          {p.joined_at ? fmt.dateTime(new Date(p.joined_at)) : "—"}
                        </td>
                        <td className="font-mono text-xs">{p.left_at ? fmt.dateTime(new Date(p.left_at)) : "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </>
  );
}
