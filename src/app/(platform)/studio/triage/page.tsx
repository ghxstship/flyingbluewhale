import { ModuleHeader } from "@/components/Shell";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { listInbox } from "@/lib/db/inbox";
import { getRequestT } from "@/lib/i18n/request";
import { InboxView } from "./InboxView";

// Auth-gated, per-user — never static (force-static would bake the unauth redirect).
export const dynamic = "force-dynamic";

/**
 * Triage — the v7.7 unified, keyboard-driven personal queue: unread
 * notifications (approvals · mentions · assignment pings, by kind) + the
 * viewer's own not-done tasks (SLA-flagged). Distinct from /studio/inbox
 * (Messages) and /studio/action-items (the cross-module work-item rollup table).
 */
export default async function TriagePage() {
  const { t } = await getRequestT();
  const session = await requireSession();
  const items = session.orgId ? await listInbox(session.orgId) : [];

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.triage.eyebrow", undefined, "Workspace")}
        title={t("console.triage.title", undefined, "Triage")}
        subtitle={t(
          "console.triage.subtitle",
          undefined,
          "Approvals, mentions, assignments, and due items in one keyboard-driven queue",
        )}
      />
      <div className="page-content">
        {items.length === 0 ? (
          <EmptyState
            title={t("console.triage.empty.title", undefined, "Inbox zero")}
            description={t(
              "console.triage.empty.description",
              undefined,
              "Nothing needs your attention right now. New approvals, mentions, assignments, and overdue items will land here.",
            )}
          />
        ) : (
          <InboxView
            items={items}
            labels={{
              open: t("console.triage.open", undefined, "Open"),
              dismiss: t("console.triage.dismiss", undefined, "Dismiss"),
              overdue: t("console.triage.overdue", undefined, "Overdue"),
              hint: t("console.triage.hint", undefined, "j/k to move, Enter to open, x to dismiss"),
              empty: t("console.triage.empty.title", undefined, "Inbox zero"),
            }}
          />
        )}
      </div>
    </>
  );
}
