import Link from "next/link";
import { Inbox } from "lucide-react";
import { FormShell } from "@/components/FormShell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { saveNotificationPrefs } from "./actions";
import { CHANNELS, EVENTS } from "./constants";

export const dynamic = "force-dynamic";

const CHANNEL_LABELS: Record<(typeof CHANNELS)[number], string> = {
  email: "Email",
  in_app: "In-app",
  slack: "Slack",
  push: "Push",
};

const DEFAULT_ON: Record<(typeof CHANNELS)[number], boolean> = {
  email: true,
  in_app: true,
  slack: false,
  push: false,
};

export default async function NotificationsPrefs() {
  const { t } = await getRequestT();
  let matrix: Record<string, Record<string, boolean>> = {};
  if (hasSupabase) {
    const session = await requireSession();
    const supabase = await createClient();
    const { data } = await supabase
      .from("user_preferences")
      .select("ui_state")
      .eq("user_id", session.userId)
      .maybeSingle();
    const ui = (data?.ui_state as Record<string, unknown> | null) ?? {};
    matrix = (ui.notifications as Record<string, Record<string, boolean>> | undefined) ?? {};
  }
  const checked = (event: string, channel: (typeof CHANNELS)[number]) =>
    matrix[event]?.[channel] ?? DEFAULT_ON[channel];

  const channelLabel = (c: (typeof CHANNELS)[number]) =>
    t(`me.notifications.channels.${c}`, undefined, CHANNEL_LABELS[c]);

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">
        {t("me.notifications.title", undefined, "Notifications")}
      </h1>
      <p className="mt-2 text-sm text-[var(--p-text-2)]">
        {t("me.notifications.subtitle", undefined, "Choose how you get updates for each workspace event.")}
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
        <FormShell
          action={saveNotificationPrefs}
          submitLabel={t("me.notifications.savePreferences", undefined, "Save Preferences")}
        >
          <div className="surface -m-2 overflow-x-auto">
            <table className="ps-table">
              <thead>
                <tr>
                  <th>{t("me.notifications.columns.event", undefined, "Event")}</th>
                  {CHANNELS.map((c) => (
                    <th key={c} className="text-center">
                      {channelLabel(c)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {EVENTS.map((e) => (
                  <tr key={e}>
                    <td className="font-mono text-xs">{e}</td>
                    {CHANNELS.map((c) => (
                      <td key={c} className="text-center">
                        <input type="checkbox" name={`${e}__${c}`} defaultChecked={checked(e, c)} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </FormShell>
      </div>
    </div>
  );
}
