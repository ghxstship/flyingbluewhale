"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { DeleteForm } from "@/components/DeleteForm";
import { EmptyState } from "@/components/ui/EmptyState";
import { useT } from "@/lib/i18n/LocaleProvider";
import { krProgress, formatPercent, type KeyResult } from "@/lib/goals";
import { KeyResultForm } from "../KeyResultForm";
import {
  createKeyResultAction,
  updateKeyResultAction,
  deleteKeyResultAction,
} from "../actions";

/**
 * Key-results panel for the goal detail page. Lists each KR with its own
 * progress bar, an inline add form, and per-row edit/delete. State writes go
 * through the bound server actions; `router.refresh()` is handled by the
 * actions' revalidatePath.
 */
export function KeyResultsPanel({
  goalId,
  keyResults,
  canEdit,
}: {
  goalId: string;
  keyResults: KeyResult[];
  canEdit: boolean;
}) {
  const t = useT();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="surface p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{t("console.goals.kr.heading", undefined, "Key Results")}</h3>
        {canEdit && !adding && (
          <Button size="sm" variant="secondary" onClick={() => setAdding(true)}>
            {t("console.goals.kr.add", undefined, "+ Add Key Result")}
          </Button>
        )}
      </div>

      {adding && (
        <div className="surface-inset mt-4 p-4">
          <KeyResultForm
            action={async (prev, fd) => {
              const res = await createKeyResultAction(goalId, prev, fd);
              if (res?.ok) setAdding(false);
              return res;
            }}
            goalId={goalId}
            submitLabel={t("console.goals.kr.submitAdd", undefined, "Add Key Result")}
          />
        </div>
      )}

      {keyResults.length === 0 && !adding ? (
        <div className="mt-4">
          <EmptyState
            title={t("console.goals.kr.empty", undefined, "No key results yet")}
            description={t(
              "console.goals.kr.emptyDescription",
              undefined,
              "Add measurable outcomes so this goal's progress can roll up automatically.",
            )}
            action={
              canEdit ? (
                <Button size="sm" onClick={() => setAdding(true)}>
                  {t("console.goals.kr.add", undefined, "+ Add Key Result")}
                </Button>
              ) : undefined
            }
          />
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {keyResults.map((kr) => {
            const progress = krProgress(kr);
            const isEditing = editingId === kr.id;
            return (
              <li key={kr.id} className="surface-inset p-4">
                {isEditing ? (
                  <KeyResultForm
                    action={async (prev, fd) => {
                      const res = await updateKeyResultAction(goalId, kr.id, prev, fd);
                      if (res?.ok) setEditingId(null);
                      return res;
                    }}
                    goalId={goalId}
                    keyResult={kr}
                    submitLabel={t("console.goals.kr.submitSave", undefined, "Save Key Result")}
                  />
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-medium">{kr.title}</div>
                        <div className="mt-0.5 text-xs text-[var(--p-text-2)]">
                          {kr.current_value} / {kr.target_value}
                          {kr.unit ? ` ${kr.unit}` : ""}
                        </div>
                      </div>
                      <StatusBadge status={kr.kr_state} />
                    </div>
                    <div className="flex items-center gap-2">
                      <ProgressBar
                        value={Math.round(progress * 100)}
                        aria-label={t("console.goals.kr.progressAria", { title: kr.title }, `${kr.title} progress`)}
                        className="flex-1"
                      />
                      <Badge variant="muted">{formatPercent(progress)}</Badge>
                    </div>
                    {canEdit && (
                      <div className="flex items-center gap-2 pt-1">
                        <Button size="sm" variant="secondary" onClick={() => setEditingId(kr.id)}>
                          {t("console.goals.kr.edit", undefined, "Edit")}
                        </Button>
                        <DeleteForm
                          action={deleteKeyResultAction.bind(null, goalId, kr.id)}
                          confirm={t(
                            "console.goals.kr.deleteConfirm",
                            { title: kr.title },
                            `Delete key result "${kr.title}"?`,
                          )}
                          undo={{ table: "key_results", id: kr.id, redirectTo: `/studio/goals/${goalId}` }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
