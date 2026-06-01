"use client";

import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/Badge";
import type { ApplicationCard, PipelinePhase } from "./page";

const PHASES: { key: PipelinePhase; label: string; color: string }[] = [
  { key: "applied", label: "Applied", color: "default" },
  { key: "screening", label: "Screening", color: "info" },
  { key: "interview", label: "Interview", color: "warning" },
  { key: "offer", label: "Offer", color: "success" },
  { key: "hired", label: "Hired", color: "success" },
  { key: "rejected", label: "Rejected", color: "error" },
];

async function moveCard(applicationId: string, phase: PipelinePhase) {
  await fetch(`/api/v1/marketplace/applications/${applicationId}/pipeline`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ pipeline_phase: phase }),
  });
}

export function PipelineBoard({
  postingId: _postingId,
  initialCards,
}: {
  postingId: string;
  initialCards: ApplicationCard[];
}) {
  const [cards, setCards] = useState(initialCards);
  const [, startTransition] = useTransition();
  const [dragId, setDragId] = useState<string | null>(null);

  function handleDrop(targetPhase: PipelinePhase) {
    if (!dragId) return;
    const card = cards.find((c) => c.id === dragId);
    if (!card || card.pipeline_phase === targetPhase) return;

    setCards((prev) =>
      prev.map((c) =>
        c.id === dragId
          ? { ...c, pipeline_phase: targetPhase, pipeline_moved_at: new Date().toISOString() }
          : c,
      ),
    );
    startTransition(() => moveCard(dragId, targetPhase));
    setDragId(null);
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-4" style={{ minHeight: "60vh" }}>
      {PHASES.map((phase) => {
        const phaseCards = cards.filter((c) => c.pipeline_phase === phase.key);
        return (
          <div
            key={phase.key}
            className="flex flex-col gap-2 rounded-lg bg-[var(--surface-raised)] p-2"
            style={{ minWidth: 220, width: 220, flexShrink: 0 }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(phase.key)}
          >
            <div className="flex items-center justify-between px-1 pb-1">
              <span className="text-xs font-semibold">{phase.label}</span>
              <Badge tone={phase.color as "default" | "info" | "warning" | "success" | "error"}>
                {phaseCards.length}
              </Badge>
            </div>
            {phaseCards.map((card) => (
              <div
                key={card.id}
                draggable
                onDragStart={() => setDragId(card.id)}
                onDragEnd={() => setDragId(null)}
                className="surface cursor-grab rounded-md border border-[var(--border-color)] p-3 shadow-sm active:cursor-grabbing hover-lift"
              >
                <p className="text-sm font-medium leading-tight">{card.applicant_name ?? "Applicant"}</p>
                {card.applicant_email && (
                  <p className="mt-0.5 truncate text-[11px] text-[var(--text-muted)]">{card.applicant_email}</p>
                )}
                {card.cover_note && (
                  <p className="mt-1.5 line-clamp-2 text-[11px] text-[var(--text-secondary)]">{card.cover_note}</p>
                )}
                <div className="mt-2">
                  <select
                    className="input-base w-full text-[11px]"
                    value={card.pipeline_phase}
                    onChange={(e) => {
                      const newPhase = e.target.value as PipelinePhase;
                      setCards((prev) =>
                        prev.map((c) =>
                          c.id === card.id
                            ? { ...c, pipeline_phase: newPhase, pipeline_moved_at: new Date().toISOString() }
                            : c,
                        ),
                      );
                      startTransition(() => moveCard(card.id, newPhase));
                    }}
                  >
                    {PHASES.map((p) => (
                      <option key={p.key} value={p.key}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
            {phaseCards.length === 0 && (
              <div className="flex items-center justify-center rounded-md border-2 border-dashed border-[var(--border-color)] p-4 text-[11px] text-[var(--text-muted)]">
                Drop here
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
