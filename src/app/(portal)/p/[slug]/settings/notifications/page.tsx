import { PortalRail } from "@/components/Shell";
import { portalNav, portalPersonaForSession } from "@/lib/nav";
import { requireSession } from "@/lib/auth";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { NotifPrefsMatrix } from "@/components/notifications/NotifPrefsMatrix";
import { loadNotifPrefs } from "@/components/notifications/loadPrefs";

export const dynamic = "force-dynamic";

/**
 * /p/[slug]/settings/notifications — portal-side notification preferences
 * (AUDIT C-31). Portal personas (artists, vendors, sponsors, delegations)
 * previously had NO surface to control notification delivery — the only
 * matrix lived in the COMPVSS field app they can't reach. This page binds
 * the shared <NotifPrefsMatrix> to the same `notification_preferences.matrix`
 * store keyed by the `notification_kind_catalog` taxonomy, so a preference
 * saved here is the exact gate `sendPushTo`/`sendPushBulk` enforce.
 *
 * Preferences are per-user (not per-project): the matrix a vendor sets here
 * follows them across every portal, the field app, and /me.
 */
export default async function PortalNotificationSettings({ params }: { params: Promise<{ slug: string }> }) {
  const { t } = await getRequestT();
  const { slug } = await params;
  if (!hasSupabase) {
    return <div className="page-content">{t("p.shared.configureSupabase", undefined, "Configure Supabase.")}</div>;
  }
  const session = await requireSession();
  const { kinds, pushEnabled } = await loadNotifPrefs(session.userId);
  const persona = portalPersonaForSession(session.persona) ?? "guest";

  return (
    <div className="flex">
      <PortalRail group={portalNav(slug, persona)} title={t("p.shared.portal", undefined, "Portal")} />
      <div className="flex-1">
        <div className="page-content">
          <div className="text-label text-[var(--p-text-3)]">
            {t("p.shared.notifSettings.eyebrow", undefined, "Settings")}
          </div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            {t("p.shared.notifSettings.title", undefined, "Notifications")}
          </h1>
          <p className="mt-2 max-w-xl text-sm text-[var(--p-text-2)]">
            {t(
              "p.shared.notifSettings.subtitle",
              undefined,
              "Choose which events send a push notification to your devices. These preferences follow your account across every project portal.",
            )}
          </p>
          <div className="mt-6 max-w-2xl">
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
                "p.shared.notifSettings.footnote",
                undefined,
                "In-app notifications always land in your portal inbox. Push only reaches devices where you have allowed notifications.",
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
