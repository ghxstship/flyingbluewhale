"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { KIcon } from "@/components/mobile/kit";
import { INCIDENT_STATE_LABEL, type IncidentState } from "@/lib/db/incident-fsm";
import { moveIncident } from "./actions";

/**
 * The triage row: the moves this incident can actually make, and nothing
 * else.
 *
 * Only renders the transitions the FSM permits from the current state, so
 * a closed incident offers nothing rather than offering buttons that fail.
 * Presenting an illegal move and then rejecting it teaches people to
 * distrust the buttons.
 */
export function TriageRow({
  id,
  current,
  allowed,
}: {
  id: string;
  current: IncidentState;
  allowed: readonly IncidentState[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const move = (to: IncidentState) => {
    if (pending) return;
    setError(null);
    const fd = new FormData();
    fd.set("id", id);
    fd.set("to", to);
    startTransition(async () => {
      const res = await moveIncident(null, fd);
      if (res?.error) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  };

  if (allowed.length === 0) {
    return (
      <div className="hint" style={{ marginTop: 8 }}>
        This incident is closed. Nothing further to do here.
      </div>
    );
  }

  return (
    <>
      {error && (
        <div className="ps-alert ps-alert--danger" role="alert" style={{ marginTop: 8 }}>
          {error}
        </div>
      )}
      <div className="wl" style={{ marginTop: 12, marginBottom: 6 }}>
        Move to
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {allowed.map((to) => (
          <button
            key={to}
            type="button"
            className={`ps-btn ps-btn--lg ${to === "closed" ? "ps-btn--cta" : "ps-btn--secondary"}`}
            style={{ width: "100%", justifyContent: "center" }}
            disabled={pending}
            onClick={() => move(to)}
          >
            <KIcon name={to === "closed" ? "Check" : to === "investigating" ? "Search" : "ArrowRight"} size={15} />{" "}
            {INCIDENT_STATE_LABEL[to]}
          </button>
        ))}
      </div>
      <div className="hint" style={{ marginTop: 6 }}>
        Currently {INCIDENT_STATE_LABEL[current].toLowerCase()}.
      </div>
    </>
  );
}
