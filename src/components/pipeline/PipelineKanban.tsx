"use client";

import { useOptimistic, useTransition, useState } from "react";
import type { DragEvent } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Badge } from "@/components/ui/Badge";
import { moveOpportunityAction } from "@/app/(platform)/console/pipeline/actions";
import { formatMoney } from "@/lib/i18n/format";
import { timeAgo } from "@/lib/format";

export type KanbanStage = {
  id: string;
  name: string;
  stage_key: string;
  display_order: number;
  is_won: boolean;
  is_terminal: boolean;
};

export type KanbanOpportunity = {
  id: string;
  title: string;
  current_stage_id: string;
  estimated_value_minor: number | null;
  estimated_value_currency: string | null;
  probability: number | null;
  expected_close: string | null;
  updated_at: string;
  account: { party: { display_name: string } | null } | null;
};

type Props = {
  stages: KanbanStage[];
  opportunities: KanbanOpportunity[];
};

function stageTone(stage: KanbanStage): "muted" | "info" | "success" | "error" {
  if (stage.is_won) return "success";
  if (stage.is_terminal) return "error";
  return "info";
}

export function PipelineKanban({ stages, opportunities }: Props) {
  const [, startTransition] = useTransition();
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);

  const [optimisticOpps, applyOptimistic] = useOptimistic(
    opportunities,
    (state: KanbanOpportunity[], { oppId, stageId }: { oppId: string; stageId: string }) =>
      state.map((o) => (o.id === oppId ? { ...o, current_stage_id: stageId } : o)),
  );

  function handleDragStart(e: DragEvent, oppId: string) {
    setDraggedId(oppId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", oppId);
  }

  function handleDragOver(e: DragEvent, stageId: string) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverStage(stageId);
  }

  function handleDrop(e: DragEvent, stageId: string) {
    e.preventDefault();
    const oppId = e.dataTransfer.getData("text/plain") || draggedId;
    setDraggedId(null);
    setDragOverStage(null);
    if (!oppId) return;

    const opp = (optimisticOpps as KanbanOpportunity[]).find((o: KanbanOpportunity) => o.id === oppId);
    if (!opp || opp.current_stage_id === stageId) return;

    startTransition(async () => {
      applyOptimistic({ oppId, stageId });
      const fd = new FormData();
      fd.set("opportunityId", oppId);
      fd.set("newStageId", stageId);
      const result = await moveOpportunityAction(fd);
      if (!result.ok) toast.error(result.error ?? "Move failed");
    });
  }

  const byStage = new Map<string, KanbanOpportunity[]>();
  for (const s of stages) byStage.set(s.id, []);
  for (const o of optimisticOpps as KanbanOpportunity[]) {
    const lane = byStage.get(o.current_stage_id);
    if (lane) lane.push(o);
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {stages.map((stage) => {
        const lane = byStage.get(stage.id) ?? [];
        const laneValue = lane.reduce((s, o) => s + (o.estimated_value_minor ?? 0), 0);
        const isOver = dragOverStage === stage.id;

        return (
          <div
            key={stage.id}
            className={`flex w-64 flex-none flex-col rounded border transition-colors ${
              isOver ? "border-[var(--org-primary)] bg-[var(--surface-raised)]" : "border-[var(--border-color)] bg-[var(--surface)]"
            }`}
            onDragOver={(e: DragEvent<HTMLDivElement>) => handleDragOver(e, stage.id)}
            onDragLeave={() => setDragOverStage(null)}
            onDrop={(e: DragEvent<HTMLDivElement>) => handleDrop(e, stage.id)}
          >
            {/* Column header */}
            <div className="flex items-center justify-between border-b border-[var(--border-color)] px-3 py-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <Badge variant={stageTone(stage)}>{stage.name}</Badge>
              </div>
              <div className="ml-2 flex-none text-right">
                <div className="font-mono text-[10px] text-[var(--text-muted)]">{formatMoney(laneValue)}</div>
                <div className="font-mono text-[10px] text-[var(--text-muted)]">{lane.length}</div>
              </div>
            </div>

            {/* Cards */}
            <ul className="min-h-[6rem] flex-1 space-y-2 p-2">
              {lane.map((o) => (
                <li
                  key={o.id}
                  draggable
                  onDragStart={(e: DragEvent<HTMLLIElement>) => handleDragStart(e, o.id)}
                  onDragEnd={() => setDraggedId(null)}
                  className={`cursor-grab rounded border border-[var(--border-color)] bg-[var(--surface-raised)] p-3 active:cursor-grabbing ${
                    draggedId === o.id ? "opacity-50" : ""
                  }`}
                >
                  <Link href={`/console/pipeline/${o.id}`} onClick={(e: { preventDefault: () => void }) => draggedId && e.preventDefault()}>
                    <div className="text-xs font-semibold leading-snug">{o.title}</div>
                    {o.account?.party?.display_name && (
                      <div className="mt-1 truncate text-[10px] text-[var(--text-muted)]">
                        {o.account.party.display_name}
                      </div>
                    )}
                    <div className="mt-2 flex items-center justify-between">
                      <span className="font-mono text-xs">
                        {formatMoney(o.estimated_value_minor, o.estimated_value_currency ?? undefined)}
                      </span>
                      {o.probability != null && (
                        <span className="font-mono text-[10px] text-[var(--text-muted)]">{o.probability}%</span>
                      )}
                    </div>
                    <div className="mt-1 font-mono text-[10px] text-[var(--text-muted)]">
                      {timeAgo(o.updated_at)}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
