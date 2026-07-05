"use client";

import * as React from "react";
import { MoreHorizontal, BellOff, Bell, MailMinus, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/DropdownMenu";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { toggleRoomMute, markRoomUnread, leaveRoom } from "./actions";

/**
 * Thread header overflow menu (kit 21 W5): Mute/Unmute · Mark Unread · Leave
 * Channel. Leave is Confirm-guarded (there's no self re-invite path) and is
 * hidden for direct rooms. Each item calls its server action, which
 * revalidates the inbox.
 */
export function ThreadMenu({
  roomId,
  muted,
  canLeave,
  labels,
}: {
  roomId: string;
  muted: boolean;
  canLeave: boolean;
  labels: {
    menu: string;
    mute: string;
    unmute: string;
    markUnread: string;
    leave: string;
    leaveConfirmTitle: string;
    leaveConfirmBody: string;
    cancel: string;
  };
}) {
  const [confirmLeave, setConfirmLeave] = React.useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className="ps-btn ps-btn--ghost ps-btn--icon" aria-label={labels.menu}>
          <MoreHorizontal size={16} aria-hidden="true" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => React.startTransition(() => void toggleRoomMute(roomId))}>
            {muted ? (
              <Bell size={14} className="me-2 text-[var(--p-text-3)]" aria-hidden="true" />
            ) : (
              <BellOff size={14} className="me-2 text-[var(--p-text-3)]" aria-hidden="true" />
            )}
            {muted ? labels.unmute : labels.mute}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => React.startTransition(() => void markRoomUnread(roomId))}>
            <MailMinus size={14} className="me-2 text-[var(--p-text-3)]" aria-hidden="true" />
            {labels.markUnread}
          </DropdownMenuItem>
          {canLeave && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  setConfirmLeave(true);
                }}
                className="text-[var(--p-danger-text)]"
              >
                <LogOut size={14} className="me-2" aria-hidden="true" />
                {labels.leave}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={confirmLeave}
        onOpenChange={setConfirmLeave}
        title={labels.leaveConfirmTitle}
        description={labels.leaveConfirmBody}
        confirmLabel={labels.leave}
        cancelLabel={labels.cancel}
        tone="danger"
        onConfirm={async () => {
          await leaveRoom(roomId);
        }}
      />
    </>
  );
}
