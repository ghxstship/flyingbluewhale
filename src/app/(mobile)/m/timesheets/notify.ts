import "server-only";
import type { Session } from "@/lib/auth";
import { sendPushBulk } from "@/lib/push/send";
import { managerUserIds } from "@/lib/db/managers";
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
    await sendPushBulk(managers, {
      title: "Timesheet Submitted",
      body: `${session.email} submitted a timesheet for approval.`,
      url: "/studio/finance/timesheets",
      kind: "timesheet",
      scope: "mobile",
      orgId: session.orgId,
      data: { timesheetId },
    });
  } catch (err) {
    log.warn("m.timesheets.notify_failed", { err: err instanceof Error ? err.message : String(err) });
  }
}
