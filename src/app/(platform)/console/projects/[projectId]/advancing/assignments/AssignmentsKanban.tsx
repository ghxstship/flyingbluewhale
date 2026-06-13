"use client";

import * as React from "react";
import { KanbanBoard, type KanbanLane } from "@/components/views/KanbanBoard";
import { Badge } from "@/components/ui/Badge";
import { type FulfillmentState } from "@/lib/db/assignments";
import { bulkAdvanceAssignments } from "./actions";

/** Row shape rendered on the board — the list projection plus the page's
 *  hydrated party label + kind label. */
export type AssignmentCardRow = {
  id: string;
  fulfillment_state: FulfillmentState;
  party_kind: "user" | "crew_member" | "external_holder";
  party: string;
  kindLabel: string;
  title: string | null;
  deadline: string | null;
};

/**
 * Lane order follows the fulfillment arc: doc/advance (briefed→delivered),
 * then the physical-asset/issuance arc (issued→returned), then terminal
 * negatives. Drops that aren't legal under NEXT_FULFILLMENT_STATES are
 * rejected server-side and the board rolls the card back with a live-region
 * announcement — the lane set is intentionally complete rather than
 * pre-filtered, so the board never hides a state a row might be in.
 */
const LANES: KanbanLane<AssignmentCardRow>[] = [
  { id: "briefed", title: "Briefed", tone: "neutral" },
  { id: "draft", title: "Draft", tone: "neutral" },
  { id: "submitted", title: "Submitted", tone: "info" },
  { id: "in_review", title: "In Review", tone: "info" },
  { id: "revision_requested", title: "Revision Requested", tone: "warn" },
  { id: "approved", title: "Approved", tone: "success" },
  { id: "delivered", title: "Delivered", tone: "success" },
  { id: "issued", title: "Issued", tone: "info" },
  { id: "transferred", title: "Transferred", tone: "info" },
  { id: "redeemed", title: "Redeemed", tone: "success" },
  { id: "returned", title: "Returned", tone: "neutral" },
  { id: "rejected", title: "Rejected", tone: "error" },
  { id: "expired", title: "Expired", tone: "error" },
  { id: "voided", title: "Voided", tone: "error" },
];

export function AssignmentsKanban({
  projectId,
  rows,
}: {
  projectId: string;
  rows: AssignmentCardRow[];
}): React.ReactElement {
  const onMove = React.useCallback(
    async (rowId: string, toLaneId: string) => {
      // Single-row drag reuses the bulk transition action (one id): it
      // re-validates against NEXT_FULFILLMENT_STATES, writes the
      // assignment_events state_change row, and notifies the party. A
      // rejected (illegal) transition throws so the board reverts.
      const res = await bulkAdvanceAssignments(projectId, toLaneId as FulfillmentState, [rowId]);
      if (res?.error) throw new Error(res.error);
    },
    [projectId],
  );

  return (
    <KanbanBoard<AssignmentCardRow>
      rows={rows}
      lanes={LANES}
      laneOf={(r) => r.fulfillment_state}
      hrefOf={(r) => `/console/projects/${projectId}/advancing/assignments/${r.id}`}
      onMove={onMove}
      emptyTitle="No Assignments Yet"
      emptyDescription="Whatever you assign here lands on the assignee's portal and mobile views in real time."
      renderCard={(r) => (
        <div className="space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <span className="line-clamp-2 text-sm font-medium text-[var(--p-text-1)]">{r.title ?? "Untitled"}</span>
            <span className="shrink-0 font-mono text-[10px] text-[var(--p-text-2)]">{r.kindLabel}</span>
          </div>
          <div className="flex items-center justify-between gap-2 text-xs text-[var(--p-text-2)]">
            {r.party_kind === "external_holder" ? (
              <Badge variant="warning">{r.party}</Badge>
            ) : (
              <span className="truncate">{r.party}</span>
            )}
            {r.deadline ? <span className="shrink-0 font-mono text-[10px]">{r.deadline.slice(0, 10)}</span> : null}
          </div>
        </div>
      )}
    />
  );
}
