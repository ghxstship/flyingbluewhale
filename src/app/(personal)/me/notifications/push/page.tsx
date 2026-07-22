import Link from "next/link";
import { Inbox } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { EmptyState } from "@/components/ui/EmptyState";
import { Alert } from "@/components/ui/Alert";
import { getRequestT } from "@/lib/i18n/request";
import { PushToggle, type RegisteredDevice } from "./PushToggle";

export const dynamic = "force-dynamic";

export default async function NotificationsPushPage() {
  const { t } = await getRequestT();
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
  const serverConfigured = Boolean(vapidPublicKey);

  if (!hasSupabase) {
    return (
      <div>
        <Header />
        <EmptyState
          title={t("me.notifications.push.unavailable.title", undefined, "Push unavailable")}
          description={t(
            "me.notifications.push.unavailable.description",
            undefined,
            "Supabase is not configured in this environment.",
          )}
        />
      </div>
    );
  }

  const session = await requireSession();
  const supabase = await createClient();

  type SubsClient = {
    from: (table: string) => {
      select: (cols: string) => {
        eq: (
          col: string,
          val: string,
        ) => {
          is: (
            col: string,
            val: null,
          ) => {
            order: (
              col: string,
              opts: { ascending: boolean },
            ) => Promise<{
              data: RegisteredDevice[] | null;
              error: { message: string } | null;
            }>;
          };
        };
      };
    };
  };

  const { data, error } = await (supabase as unknown as SubsClient)
    .from("push_subscriptions")
    .select("id, endpoint, user_agent, created_at, last_seen_at")
    .eq("user_id", session.userId)
    .is("disabled_at", null)
    .order("last_seen_at", { ascending: false });

  const devices: RegisteredDevice[] = data ?? [];

  return (
    <div>
      <Header />
      {!serverConfigured && (
        <div className="mb-4">
          <Alert kind="warning">
            {t(
              "me.notifications.push.notConfigured.prefix",
              undefined,
              "Push notifications are not yet enabled on this server. An administrator must set",
            )}
            <code className="mx-1 rounded bg-[var(--p-surface-2)] px-1 font-mono text-xs">VAPID_*</code>
            {t("me.notifications.push.notConfigured.and", undefined, "and")}
            <code className="mx-1 rounded bg-[var(--p-surface-2)] px-1 font-mono text-xs">
              NEXT_PUBLIC_VAPID_PUBLIC_KEY
            </code>
            {t("me.notifications.push.notConfigured.suffix", undefined, "environment variables.")}
          </Alert>
        </div>
      )}
      {error && (
        <div className="mb-4">
          <Alert kind="error">
            {t(
              "me.notifications.push.loadError",
              { message: error.message },
              `Couldn't load registered devices: ${error.message}`,
            )}
          </Alert>
        </div>
      )}
      <PushToggle vapidPublicKey={vapidPublicKey} initialDevices={devices} />
    </div>
  );
}

async function Header() {
  const { t } = await getRequestT();
  return (
    <header className="mb-6">
      <h1>
        {t("me.notifications.push.title", undefined, "Push Notifications")}
      </h1>
      <p className="mt-2 text-sm text-[var(--p-text-2)]">
        {t(
          "me.notifications.push.subtitle",
          undefined,
          "Get notified in your browser even when the ATLVS tab is closed.",
        )}
      </p>
      <div className="surface mt-4 flex items-center justify-between gap-3 p-3">
        <div className="flex items-center gap-2">
          <Inbox size={16} className="text-[var(--p-text-2)]" aria-hidden="true" />
          <p className="text-sm text-[var(--p-text-2)]">
            {t("me.notifications.push.configurePrompt", undefined, "Configure which events trigger push?")}{" "}
            <Link href="/me/notifications" className="font-medium text-[var(--p-text-1)] underline">
              {t("me.notifications.push.editPreferences", undefined, "Edit Preferences")}
            </Link>
          </p>
        </div>
      </div>
    </header>
  );
}
