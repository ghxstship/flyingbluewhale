"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useUserPreferences } from "@/lib/hooks/useUserPreferences";
import type { MobileRole } from "@/lib/nav";

const ROLE_TITLE: Record<MobileRole, string> = {
  performer: "Performer",
  crew: "Crew",
  driver: "Driver",
  medic: "Medic",
  guard: "Guard",
  admin: "Admin",
};

const ROLE_DESC: Record<MobileRole, string> = {
  performer: "Talent — schedule, advancing, comms.",
  crew: "Production crew — shifts, ROS, daily log.",
  driver: "Logistics — run sheets, dispatch, wayfind.",
  medic: "Medical — patient log, queue, alerts.",
  guard: "Security — gate, incidents, patrol.",
  admin: "Ops admin — all surfaces in the Tools drawer.",
};

/**
 * Mobile role picker — writes `ui_state.mobile_role` and routes the
 * user to that role's home page (which is either the new
 * `/m/[role]` dynamic page or the existing static surface, depending
 * on whether the role name already has one).
 */
export function RoleChooser({ current, roles }: { current: MobileRole; roles: MobileRole[] }) {
  const router = useRouter();
  const { setPrefs } = useUserPreferences();
  const [picked, setPicked] = React.useState<MobileRole>(current);
  const [pending, setPending] = React.useState(false);

  async function pick(r: MobileRole) {
    if (r === picked || pending) return;
    setPicked(r);
    setPending(true);
    try {
      await setPrefs({ mobile_role: r });
      router.push(`/m/${r}`);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-2">
      {roles.map((r) => (
        <button
          key={r}
          type="button"
          onClick={() => void pick(r)}
          aria-pressed={picked === r}
          disabled={pending}
          className="surface hover-lift flex flex-col items-start gap-1 px-3 py-2 text-left text-sm disabled:opacity-60"
        >
          <span className="font-medium">{ROLE_TITLE[r]}</span>
          <span className="text-[11px] text-[var(--text-muted)]">{ROLE_DESC[r]}</span>
        </button>
      ))}
    </div>
  );
}
