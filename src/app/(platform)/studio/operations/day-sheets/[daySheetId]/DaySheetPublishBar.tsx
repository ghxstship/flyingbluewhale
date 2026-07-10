"use client";

import * as React from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/lib/hooks/useToast";
import { NEXT_DAY_SHEET_STATES, DAY_SHEET_STATE_LABELS, type DaySheetState } from "@/lib/db/day-sheets";
import { transitionDaySheetAction, type State } from "./actions";

const CTA_LABEL: Partial<Record<DaySheetState, string>> = {
  draft: "Move To Draft",
  published: "Publish To Field",
  updated: "Re-Publish · Mark Updated",
};

export function DaySheetPublishBar({ daySheetId, state }: { daySheetId: string; state: DaySheetState }) {
  const router = useRouter();
  const toast = useToast();
  const [result, formAction, pending] = useActionState<State, FormData>(transitionDaySheetAction, null);
  const next = NEXT_DAY_SHEET_STATES[state] ?? [];

  React.useEffect(() => {
    if (result?.ok) {
      toast.success("Day sheet updated");
      router.refresh();
    } else if (result?.error) {
      toast.error(result.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  if (next.length === 0) return null;

  return (
    <form action={formAction} className="inline-flex items-center gap-2">
      <input type="hidden" name="day_sheet_id" value={daySheetId} />
      {next.map((to) => (
        <Button key={to} type="submit" name="to" value={to} size="sm" disabled={pending}>
          {pending ? "…" : (CTA_LABEL[to] ?? `Move To ${DAY_SHEET_STATE_LABELS[to]}`)}
        </Button>
      ))}
    </form>
  );
}
