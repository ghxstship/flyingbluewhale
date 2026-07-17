"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { KIcon } from "@/components/mobile/kit";
import { useT } from "@/lib/i18n/LocaleProvider";
import { joinSpace, leaveSpace } from "../actions";

/** Join/leave — the state the kit says "persists". It does: chat_room_members. */
export function SpaceMembership({ roomId, joined }: { roomId: string; joined: boolean }) {
  const t = useT();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const act = () => {
    if (pending) return;
    setError(null);
    const fd = new FormData();
    fd.set("roomId", roomId);
    startTransition(async () => {
      const res = joined ? await leaveSpace(null, fd) : await joinSpace(null, fd);
      if (res?.error) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  };

  return (
    <>
      {error && (
        <div className="ps-alert ps-alert--danger" role="alert" style={{ marginTop: 8 }}>
          {error}
        </div>
      )}
      <button
        type="button"
        className={`ps-btn ps-btn--lg ${joined ? "ps-btn--tertiary" : "ps-btn--cta"}`}
        style={{ width: "100%", justifyContent: "center", marginTop: 8 }}
        disabled={pending}
        onClick={act}
      >
        <KIcon name={joined ? "LogOut" : "UserPlus"} size={15} />{" "}
        {pending
          ? t("m.spaces.working", undefined, "Working…")
          : joined
            ? t("m.spaces.leave", undefined, "Leave Space")
            : t("m.spaces.join", undefined, "Join Space")}
      </button>
    </>
  );
}
