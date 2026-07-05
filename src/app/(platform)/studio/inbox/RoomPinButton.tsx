"use client";

import * as React from "react";
import { Pin, PinOff } from "lucide-react";
import { Hint } from "@/components/ui/Tooltip";
import { toggleRoomPin } from "./actions";

/**
 * Pin toggle for a room-list row (kit 21 W5). Sits as a sibling of the row
 * Link (a button inside an anchor is invalid HTML), revealed on hover unless
 * already pinned. Calls the pin server action, which revalidates the inbox.
 */
export function RoomPinButton({ roomId, pinned, labels }: { roomId: string; pinned: boolean; labels: { pin: string; unpin: string } }) {
  const [busy, setBusy] = React.useState(false);
  return (
    <Hint label={pinned ? labels.unpin : labels.pin} side="left">
      <button
        type="button"
        aria-label={pinned ? labels.unpin : labels.pin}
        disabled={busy}
        onClick={() => {
          setBusy(true);
          React.startTransition(async () => {
            await toggleRoomPin(roomId);
            setBusy(false);
          });
        }}
        className={`rounded p-1 text-[var(--p-text-3)] transition-opacity hover:text-[var(--p-text-1)] focus-visible:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--p-accent)] ${
          pinned ? "opacity-100 text-[var(--p-accent-text)]" : "opacity-0 group-hover:opacity-100"
        }`}
      >
        {pinned ? <Pin size={13} /> : <PinOff size={13} />}
      </button>
    </Hint>
  );
}
