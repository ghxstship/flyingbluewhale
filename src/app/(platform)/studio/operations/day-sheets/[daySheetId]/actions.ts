"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { canTransitionDaySheet, DAY_SHEET_STATES, type DaySheetState } from "@/lib/db/day-sheets";
import { sendPushBulk } from "@/lib/push/send";
import { actionErrorMessage } from "@/lib/errors";

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
  if (!isManagerPlus(session)) return { error: actionErrorMessage("auth.manager-plus.publish-day-sheets", "Only manager+ can publish day sheets") };
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: actionErrorMessage("invalid.transition", "Invalid transition") };
  const supabase = await createClient();

  const { data: sheet } = await supabase
    .from("day_sheets")
    .select("id, sheet_state, project_id, city, venue, sheet_date")
    .eq("id", parsed.data.day_sheet_id)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!sheet) return { error: actionErrorMessage("not-found.day-sheet", "Day sheet not found") };

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

  // Push-to-field (kit 26): publishing a sheet notifies the date's project
  // crew on the COMPVSS PWA. Best-effort — a push failure never blocks the
  // state transition the operator just made.
  const typedSheet = sheet as {
    project_id: string | null;
    city: string | null;
    venue: string | null;
    sheet_date: string | null;
  };
  if (publishing && typedSheet.project_id) {
    const { data: members } = await supabase
      .from("project_members")
      .select("user_id")
      .eq("project_id", typedSheet.project_id);
    const userIds = [...new Set(((members ?? []) as Array<{ user_id: string }>).map((m) => m.user_id))];
    if (userIds.length > 0) {
      const where = [typedSheet.city, typedSheet.venue].filter(Boolean).join(" · ");
      await sendPushBulk(userIds, {
        title: to === "updated" ? "Day Sheet Updated" : "Day Sheet Published",
        body: [where || "Your show day", typedSheet.sheet_date].filter(Boolean).join(" · "),
        url: "/m",
        kind: "announcement",
        scope: "mobile",
        projectId: typedSheet.project_id,
        orgId: session.orgId,
      }).catch(() => {});
    }
  }

  revalidatePath(`/studio/operations/day-sheets/${parsed.data.day_sheet_id}`);
  revalidatePath("/studio/operations/day-sheets");
  return { ok: true };
}
