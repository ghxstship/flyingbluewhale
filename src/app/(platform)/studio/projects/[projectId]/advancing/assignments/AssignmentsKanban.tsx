"use client";

import * as React from "react";
import { KanbanBoard, type KanbanLane } from "@/components/views/KanbanBoard";
import { Badge } from "@/components/ui/Badge";
import { useT } from "@/lib/i18n/LocaleProvider";
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
export function AssignmentsKanban({
  projectId,
  rows,
}: {
  projectId: string;
  rows: AssignmentCardRow[];
}): React.ReactElement {
  const t = useT();
  const lanes: KanbanLane<AssignmentCardRow>[] = [
    { id: "briefed", title: t("console.projects.assignmentsKanban.lanes.briefed", undefined, "Briefed"), tone: "neutral" },
    { id: "draft", title: t("console.projects.assignmentsKanban.lanes.draft", undefined, "Draft"), tone: "neutral" },
    { id: "submitted", title: t("console.projects.assignmentsKanban.lanes.submitted", undefined, "Submitted"), tone: "info" },
    { id: "in_review", title: t("console.projects.assignmentsKanban.lanes.inReview", undefined, "In Review"), tone: "info" },
    {
      id: "revision_requested",
      title: t("console.projects.assignmentsKanban.lanes.revisionRequested", undefined, "Revision Requested"),
      tone: "warn",
    },
    { id: "approved", title: t("console.projects.assignmentsKanban.lanes.approved", undefined, "Approved"), tone: "success" },
    { id: "delivered", title: t("console.projects.assignmentsKanban.lanes.delivered", undefined, "Delivered"), tone: "success" },
    { id: "issued", title: t("console.projects.assignmentsKanban.lanes.issued", undefined, "Issued"), tone: "info" },
    { id: "transferred", title: t("console.projects.assignmentsKanban.lanes.transferred", undefined, "Transferred"), tone: "info" },
    { id: "redeemed", title: t("console.projects.assignmentsKanban.lanes.redeemed", undefined, "Redeemed"), tone: "success" },
    { id: "returned", title: t("console.projects.assignmentsKanban.lanes.returned", undefined, "Returned"), tone: "neutral" },
    { id: "rejected", title: t("console.projects.assignmentsKanban.lanes.rejected", undefined, "Rejected"), tone: "error" },
    { id: "expired", title: t("console.projects.assignmentsKanban.lanes.expired", undefined, "Expired"), tone: "error" },
    { id: "voided", title: t("console.projects.assignmentsKanban.lanes.voided", undefined, "Voided"), tone: "error" },
  ];
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
      lanes={lanes}
      laneOf={(r) => r.fulfillment_state}
      hrefOf={(r) => `/studio/projects/${projectId}/advancing/assignments/${r.id}`}
      onMove={onMove}
      emptyTitle={t("console.projects.assignmentsKanban.empty", undefined, "No Assignments Yet")}
      emptyDescription={t(
        "console.projects.assignmentsKanban.emptyDescription",
        undefined,
        "Whatever you assign here lands on the assignee's portal and mobile views in real time.",
      )}
      renderCard={(r) => (
        <div className="space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <span className="line-clamp-2 text-sm font-medium text-[var(--p-text-1)]">
              {r.title ?? t("console.projects.assignmentsKanban.untitled", undefined, "Untitled")}
            </span>
            <span className="shrink-0 font-mono text-[11px] text-[var(--p-text-2)]">{r.kindLabel}</span>
          </div>
          <div className="flex items-center justify-between gap-2 text-xs text-[var(--p-text-2)]">
            {r.party_kind === "external_holder" ? (
              <Badge variant="warning">{r.party}</Badge>
            ) : (
              <span className="truncate">{r.party}</span>
            )}
            {r.deadline ? <span className="shrink-0 font-mono text-[11px]">{r.deadline.slice(0, 10)}</span> : null}
          </div>
        </div>
      )}
    />
  );
}
