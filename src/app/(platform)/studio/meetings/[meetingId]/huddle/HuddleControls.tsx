"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import type { VideoCallState } from "@/lib/video";
import { ensureCall, transitionCall, joinCall, leaveCall, type State } from "./actions";

import { useActionErrorResolver } from "@/lib/errors-client";
/**
 * Client island for the huddle's join/leave + lifecycle controls. The page
 * is a server component; these are the only interactive bits, so they live
 * in their own "use client" boundary. Each control is a tiny form bound to
 * a server action via useActionState — RLS + the action's own role checks
 * are the authorization boundary.
 *
 * No WebRTC client dep here: this drives presence + lifecycle only. When a
 * provider is configured, the join token mint (src/lib/video/provider.ts)
 * is what activates live media — wiring the browser SDK to that token is
 * the operator's final integration step.
 */

type Props =
  | { kind: "ensure"; meetingId: string }
  | {
      kind: "member";
      meetingId: string;
      callId: string;
      callState: VideoCallState;
      iAmPresent: boolean;
      canManage: boolean;
    };

export function HuddleControls(props: Props) {
  if (props.kind === "ensure") {
    return <EnsureForm meetingId={props.meetingId} />;
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      <JoinLeave
        meetingId={props.meetingId}
        callId={props.callId}
        callState={props.callState}
        iAmPresent={props.iAmPresent}
      />
      {props.canManage && (
        <LifecycleControls meetingId={props.meetingId} callId={props.callId} callState={props.callState} />
      )}
    </div>
  );
}

function EnsureForm({ meetingId }: { meetingId: string }) {
  const [state, action, pending] = useActionState<State, FormData>(ensureCall, null);
  const resolveErr = useActionErrorResolver();
  return (
    <form action={action} className="flex flex-col items-center gap-2">
      <input type="hidden" name="meetingId" value={meetingId} />
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Starting…" : "Start huddle"}
      </Button>
      {state?.error && <Alert kind="error">{resolveErr(state.error)}</Alert>}
    </form>
  );
}

function JoinLeave({
  meetingId,
  callId,
  callState,
  iAmPresent,
}: {
  meetingId: string;
  callId: string;
  callState: VideoCallState;
  iAmPresent: boolean;
}) {
  const [joinState, joinAction, joining] = useActionState<State, FormData>(joinCall, null);
  const [leaveState, leaveAction, leaving] = useActionState<State, FormData>(leaveCall, null);
  const resolveErr = useActionErrorResolver();
  const ended = callState === "ended";

  return (
    <div className="flex items-center gap-2">
      {iAmPresent ? (
        <form action={leaveAction}>
          <input type="hidden" name="meetingId" value={meetingId} />
          <input type="hidden" name="callId" value={callId} />
          <Button type="submit" size="sm" variant="ghost" disabled={leaving}>
            {leaving ? "Leaving…" : "Leave"}
          </Button>
        </form>
      ) : (
        <form action={joinAction}>
          <input type="hidden" name="meetingId" value={meetingId} />
          <input type="hidden" name="callId" value={callId} />
          <Button type="submit" size="sm" disabled={joining || ended}>
            {joining ? "Joining…" : ended ? "Call ended" : "Join"}
          </Button>
        </form>
      )}
      {joinState?.error && <Alert kind="error">{resolveErr(joinState.error)}</Alert>}
      {leaveState?.error && <Alert kind="error">{resolveErr(leaveState.error)}</Alert>}
    </div>
  );
}

function LifecycleControls({
  meetingId,
  callId,
  callState,
}: {
  meetingId: string;
  callId: string;
  callState: VideoCallState;
}) {
  const [state, action, pending] = useActionState<State, FormData>(transitionCall, null);
  const resolveErr = useActionErrorResolver();
  return (
    <div className="flex items-center gap-2">
      {callState === "scheduled" && (
        <form action={action}>
          <input type="hidden" name="meetingId" value={meetingId} />
          <input type="hidden" name="callId" value={callId} />
          <input type="hidden" name="to" value="live" />
          <Button type="submit" size="sm" variant="ghost" disabled={pending}>
            {pending ? "…" : "Go live"}
          </Button>
        </form>
      )}
      {callState !== "ended" && (
        <form action={action}>
          <input type="hidden" name="meetingId" value={meetingId} />
          <input type="hidden" name="callId" value={callId} />
          <input type="hidden" name="to" value="ended" />
          <Button type="submit" size="sm" variant="danger" disabled={pending}>
            {pending ? "…" : "End call"}
          </Button>
        </form>
      )}
      {state?.error && <Alert kind="error">{resolveErr(state.error)}</Alert>}
    </div>
  );
}
