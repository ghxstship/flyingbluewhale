"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { canTransitionDaySheet, DAY_SHEET_STATES, type DaySheetState } from "@/lib/db/day-sheets";

export type State = { error?: string; ok?: true } | null;

const Schema = z.object({
  day_sheet_id: z.string().uuid(),
  to: z.enum(DAY_SHEET_STATES),
});

/**
 * Advance a day sheet's lifecycle. Publishing (draft → published, or updated →
 * published) stamps `published_at`; this is the point the sheet renders to PDF
 * and pushes to the COMPVSS Field crew PWA. Transitions are validated server-side
 * against NEXT_DAY_SHEET_STATES so a stale tab can't write an illegal jump.
 */
export async function transitionDaySheetAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Only manager+ can publish day sheets" };
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Invalid transition" };
  const supabase = await createClient();

  const { data: sheet } = await supabase
    .from("day_sheets")
    .select("id, sheet_state")
    .eq("id", parsed.data.day_sheet_id)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!sheet) return { error: "Day sheet not found" };

  const from = (sheet as { sheet_state: DaySheetState }).sheet_state;
  const to = parsed.data.to;
  if (!canTransitionDaySheet(from, to)) {
    return { error: `Cannot move a ${from} day sheet to ${to}` };
  }

  const publishing = to === "published" || to === "updated";
  const { error } = await supabase
    .from("day_sheets")
    .update({
      sheet_state: to,
      ...(publishing ? { published_at: new Date().toISOString() } : {}),
    })
    .eq("id", parsed.data.day_sheet_id)
    .eq("org_id", session.orgId);
  if (error) return { error: error.message };

  revalidatePath(`/studio/operations/day-sheets/${parsed.data.day_sheet_id}`);
  revalidatePath("/studio/operations/day-sheets");
  return { ok: true };
}
