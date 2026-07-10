"use client";

import * as React from "react";
import { KanbanBoard, type KanbanLane } from "@/components/views/KanbanBoard";
import { useT } from "@/lib/i18n/LocaleProvider";
import { moveOpportunityStage } from "./actions";

export type PipelineCard = {
  id: string;
  title: string;
  stageId: string;
  /** Server-formatted money — the client never re-derives currency. */
  valueText: string;
  probability: number | null;
  account: string | null;
  closeDate: string | null;
  updatedText: string;
};

export type PipelineLane = {
  id: string;
  title: string;
  tone: "neutral" | "info" | "success" | "warn" | "error";
};

/**
 * Client kanban island for the sales pipeline (audit A-23) — replaces the
 * read-only server-rendered stage sections. Drag a deal between lanes to
 * fire the stage-transition server action; the shared KanbanBoard owns the
 * optimistic move and rolls back if the action rejects. Keyboard moves
 * (Space to lift, arrows, Enter to drop) come with the board.
 */
export function PipelineKanban({ cards, lanes }: { cards: PipelineCard[]; lanes: PipelineLane[] }): React.ReactElement {
  const t = useT();
  const boardLanes: KanbanLane<PipelineCard>[] = React.useMemo(
    () => lanes.map((l) => ({ id: l.id, title: l.title, tone: l.tone })),
    [lanes],
  );

  const onMove = React.useCallback(async (rowId: string, toLaneId: string) => {
    const result = await moveOpportunityStage(rowId, toLaneId);
    if (result && "error" in result && result.error) throw new Error(result.error);
  }, []);

  return (
    <KanbanBoard<PipelineCard>
      rows={cards}
      lanes={boardLanes}
      laneOf={(c) => c.stageId}
      hrefOf={(c) => `/studio/pipeline/${c.id}`}
      onMove={onMove}
      emptyTitle={t("console.pipeline.board.emptyTitle", undefined, "No open deals")}
      emptyDescription={t(
        "console.pipeline.board.emptyDescription",
        undefined,
        "Convert a qualified lead or add a deal to start working the funnel.",
      )}
      renderCard={(c) => (
        <div className="space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <span className="line-clamp-2 text-sm font-medium text-[var(--p-text-1)]">{c.title}</span>
            {c.probability != null ? (
              <span className="font-mono text-[11px] text-[var(--p-text-2)]">{c.probability}%</span>
            ) : null}
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-xs text-[var(--p-text-2)]">{c.account ?? ""}</span>
            <span className="font-mono text-xs tabular-nums">{c.valueText}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-[var(--p-text-3)]">
            {c.closeDate ? (
              <span>{t("console.pipeline.opp.close", { date: c.closeDate }, `· close ${c.closeDate}`)}</span>
            ) : null}
            <span>{c.updatedText}</span>
          </div>
        </div>
      )}
    />
  );
}
