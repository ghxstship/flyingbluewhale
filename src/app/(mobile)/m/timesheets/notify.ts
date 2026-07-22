import "server-only";
import type { Session } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { sendPushBulk } from "@/lib/push/send";
import { managerUserIds } from "@/lib/db/managers";
import { urlFor } from "@/lib/urls";
import { log } from "@/lib/log";

/**
 * Tell the manager band a timesheet is waiting on them.
 *
 * Best-effort: a notify failure must never roll back a submission the worker
 * has already made. They'd have no way to tell the difference between "not
 * submitted" and "submitted but nobody was told", and would submit again.
 *
 * Uses `sendPushBulk` with an explicit `kind`, not `notify()`. The `kind` is
 * the ONLY opt-out signal `filterByPushPrefs` reads, so omitting it makes the
 * /m/settings/notifications matrix a placebo for this event.
 */
export async function notifyManagersOfSubmission(session: Session, timesheetId: string): Promise<void> {
  try {
    const managers = await managerUserIds(session.orgId, session.userId);
    if (!managers.length) return;
    // Name over email: the push lands on managers' lock screens — show the
    // worker's display name, falling back to the email only when unset.
    const supabase = await createClient();
    const { data: user } = await supabase
      .from("users")
      .select("name")
      .eq("id", session.userId)
      .is("deleted_at", null)
      .maybeSingle();
    const who = (user?.name as string | null)?.trim() || session.email;
    await sendPushBulk(managers, {
      title: "Timesheet Submitted",
      body: `${who} submitted a timesheet for approval.`,
      // Absolute, via the canonical cross-shell helper: the push lands on the
      // compvss service-worker origin, where a relative /studio/... path would
      // open the console under the wrong host.
      url: urlFor("platform", "/finance/timesheets"),
      kind: "timesheet",
      scope: "mobile",
      orgId: session.orgId,
      data: { timesheetId },
    });
  } catch (err) {
    log.warn("m.timesheets.notify_failed", { err: err instanceof Error ? err.message : String(err) });
  }
}
