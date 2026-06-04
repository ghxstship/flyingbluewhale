import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { LocaleSwitcher } from "@/components/marketing/LocaleSwitcher";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { PushToggle, type RegisteredDevice } from "@/app/(personal)/me/notifications/push/PushToggle";

export const dynamic = "force-dynamic";

export default async function MobileSettings() {
  const { t } = await getRequestT();
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
  let devices: RegisteredDevice[] = [];
  if (hasSupabase) {
    const session = await requireSession();
    const supabase = await createClient();
    const { data } = await (
      supabase as unknown as {
        from: (t: string) => {
          select: (c: string) => {
            eq: (
              col: string,
              val: string,
            ) => {
              is: (
                col: string,
                val: null,
              ) => {
                order: (col: string, opts: { ascending: boolean }) => Promise<{ data: RegisteredDevice[] | null }>;
              };
            };
          };
        };
      }
    )
      .from("push_subscriptions")
      .select("id, endpoint, user_agent, created_at, last_seen_at")
      .eq("user_id", session.userId)
      .is("disabled_at", null)
      .order("last_seen_at", { ascending: false });
    devices = data ?? [];
  }

  return (
    <div className="px-4 pt-6 pb-24">
      <div className="text-xs font-semibold tracking-wider text-[var(--org-primary)] uppercase">
        {t("m.settings.eyebrow", undefined, "Field")}
      </div>
      <h1 className="mt-1 text-2xl font-semibold">{t("m.settings.title", undefined, "Settings")}</h1>
      <div className="mt-6 space-y-3">
        <div className="surface p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">{t("m.settings.language.title", undefined, "Language")}</div>
              <div className="mt-1 text-xs text-[var(--text-muted)]">
                {t("m.settings.language.description", undefined, "Affects every label, date, and number in the app.")}
              </div>
            </div>
            <LocaleSwitcher />
          </div>
        </div>

        <div className="surface p-4">
          <div className="text-sm font-semibold">{t("m.settings.push.title", undefined, "Push Notifications")}</div>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            {t(
              "m.settings.push.description",
              undefined,
              "Get pinged when new announcements, chat messages, kudos, or badge awards land. Works while the app is backgrounded.",
            )}
          </p>
          <div className="mt-3">
            {vapidPublicKey ? (
              <PushToggle vapidPublicKey={vapidPublicKey} initialDevices={devices} />
            ) : (
              <p className="text-xs text-[var(--text-muted)]">
                {t(
                  "m.settings.push.missingVapid",
                  undefined,
                  "Push requires NEXT_PUBLIC_VAPID_PUBLIC_KEY in env. Ask an admin to configure.",
                )}
              </p>
            )}
            <Link
              href="/m/settings/notifications"
              className="mt-3 inline-block text-xs text-[var(--text-secondary)] underline"
            >
              {t("m.settings.push.managePreferences", undefined, "Manage per-kind notification preferences →")}
            </Link>
          </div>
        </div>

        <div className="surface p-4">
          <div className="text-sm font-semibold">{t("m.settings.offline.title", undefined, "Offline Mode")}</div>
          <div className="mt-1 flex items-center justify-between text-xs">
            <span className="text-[var(--text-muted)]">
              {t("m.settings.offline.serviceWorker", undefined, "Service worker cache")}
            </span>
            <Badge variant="success">{t("m.settings.offline.ready", undefined, "Ready")}</Badge>
          </div>
        </div>
        <div className="surface p-4">
          <div className="text-sm font-semibold">{t("m.settings.camera.title", undefined, "Camera")}</div>
          <div className="mt-1 text-xs text-[var(--text-muted)]">
            {t("m.settings.camera.description", undefined, "Required for scan + incident reports.")}
          </div>
        </div>
        <div className="surface p-4">
          <div className="text-sm font-semibold">{t("m.settings.location.title", undefined, "Location")}</div>
          <div className="mt-1 text-xs text-[var(--text-muted)]">
            {t("m.settings.location.description", undefined, "Used for geo-verified clock in/out.")}
          </div>
        </div>
        <form action="/auth/signout" method="post">
          <button type="submit" className="btn btn-ghost w-full">
            {t("m.settings.signOut", undefined, "Sign Out")}
          </button>
        </form>
        <div className="text-center text-[10px] text-[var(--text-muted)]">
          <Link href="/" className="font-medium text-[var(--text-muted)]">
            COMPVSS · v0.1
          </Link>
        </div>
      </div>
    </div>
  );
}
