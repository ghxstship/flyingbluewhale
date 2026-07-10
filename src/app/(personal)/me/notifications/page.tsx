import Link from "next/link";
import { Inbox } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { NotifPrefsMatrix } from "@/components/notifications/NotifPrefsMatrix";
import { loadNotifPrefs } from "@/components/notifications/loadPrefs";

export const dynamic = "force-dynamic";

/**
 * /me/notifications — the desktop view of the ONE notification-preference
 * store. Reads/writes `notification_preferences.matrix` keyed by the
 * `notification_kind_catalog` taxonomy — the exact store the push fan-out
 * (`filterByPushPrefs`, src/lib/push/send.ts) gates delivery on.
 *
 * Replaces the retired placebo that saved a different taxonomy to
 * `user_preferences.ui_state.notifications`, which nothing ever read
 * (AUDIT C-22 / F-02). Only channels that actually deliver are shown:
 * Push (toggleable per kind) and In-app (always written to the bell).
 */
export default async function NotificationsPrefs() {
  const { t } = await getRequestT();

  if (!hasSupabase) {
    return (
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("me.notifications.title", undefined, "Notifications")}
        </h1>
        <p className="mt-2 text-sm text-[var(--p-text-2)]">
          {t("me.notifications.configureSupabase", undefined, "Configure Supabase.")}
        </p>
      </div>
    );
  }

  const session = await requireSession();
  const { kinds, pushEnabled } = await loadNotifPrefs(session.userId);

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">
        {t("me.notifications.title", undefined, "Notifications")}
      </h1>
      <p className="mt-2 text-sm text-[var(--p-text-2)]">
        {t(
          "me.notifications.honestSubtitle",
          undefined,
          "Choose which events send a push notification to your devices. Changes save instantly.",
        )}
      </p>
      <div className="surface mt-4 flex items-center justify-between gap-3 p-3">
        <div className="flex items-center gap-2">
          <Inbox size={16} className="text-[var(--p-text-2)]" aria-hidden="true" />
          <p className="text-sm text-[var(--p-text-2)]">
            {t("me.notifications.inboxPrompt", undefined, "Looking for your inbox?")}{" "}
            <Link href="/me/notifications/inbox" className="font-medium text-[var(--p-text-1)] underline">
              {t("me.notifications.openInbox", undefined, "Open Inbox")}
            </Link>
            {" · "}
            <Link href="/me/notifications/push" className="font-medium text-[var(--p-text-1)] underline">
              {t("me.notifications.pushDevices", undefined, "Push Devices")}
            </Link>
          </p>
        </div>
      </div>
      <div className="mt-6">
        <NotifPrefsMatrix
          kinds={kinds}
          initial={pushEnabled}
          labels={{
            eventColumn: t("me.notifications.columns.event", undefined, "Event"),
            pushColumn: t("me.notifications.columns.push", undefined, "Push"),
            inAppColumn: t("me.notifications.columns.inApp", undefined, "In-app"),
            inAppAlwaysOn: t(
              "me.notifications.inAppAlwaysOn",
              undefined,
              "In-app inbox entries are always recorded so you never miss a record of what happened.",
            ),
            viaTemplate: t(
              "me.notifications.viaChannel",
              { event: "{event}", channel: "{channel}" },
              "{event} via {channel}",
            ),
          }}
        />
        <p className="mt-3 text-xs text-[var(--p-text-2)]">
          {t(
            "me.notifications.inAppFootnote",
            undefined,
            "In-app notifications always land in your inbox. Push only reaches devices you have enabled under Push Devices.",
          )}
        </p>
      </div>
    </div>
  );
}
