"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Crumbs, RecordDetail } from "@/components/mobile/kit";
import { useT } from "@/lib/i18n/LocaleProvider";
import { useToast } from "@/lib/hooks/useToast";
import { dismissNotification, markNotificationRead } from "./actions";

/**
 * Client leaf for /m/notifications/[id] — renders the kit RecordDetail
 * (eyebrow · fields · delivery timeline · actions). Actions are real writes:
 * Mark Read stamps read_at, Dismiss soft-deletes and returns to the bell
 * list, Mute opens the per-kind notification matrix, and the related-record
 * action deep-links to the row's `href` payload ref.
 */
export function NotificationDetail({
  id,
  title,
  body,
  tone,
  toneLabel,
  kindLabel,
  projectName,
  received,
  receivedRelative,
  readAt,
  isRead,
  relatedHref,
}: {
  id: string;
  title: string;
  body: string | null;
  tone: "warn" | "ok" | "info" | "neutral";
  toneLabel: string;
  kindLabel: string;
  projectName: string | null;
  received: string;
  receivedRelative: string;
  readAt: string | null;
  isRead: boolean;
  relatedHref: string | null;
}) {
  const t = useT();
  const router = useRouter();
  const toast = useToast();
  const [, startTransition] = useTransition();

  const send = (action: (id: string) => Promise<{ error?: string } | null>, done?: () => void) => {
    startTransition(async () => {
      const res = await action(id);
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      done?.();
      router.refresh();
    });
  };

  return (
    <div className="screen screen-anim">
      <Crumbs
        items={[
          { label: t("m.alerts.title", undefined, "Notifications"), href: "/m/notifications" },
          { label: kindLabel },
        ]}
      />
      <RecordDetail
        eyebrow={`${toneLabel} · ${receivedRelative}`}
        title={title}
        icon="Bell"
        recent={{ href: `/m/notifications/${id}`, title, kind: "Bell" }}
        status={{ tone, label: toneLabel }}
        fields={[
          { k: t("m.alerts.detail.type", undefined, "Type"), v: kindLabel },
          { k: t("m.alerts.detail.received", undefined, "Received"), v: received },
          ...(projectName ? [{ k: t("m.alerts.detail.project", undefined, "Project"), v: projectName }] : []),
          { k: t("m.alerts.detail.channel", undefined, "Channel"), v: t("m.alerts.detail.channelValue", undefined, "Push · In-App") },
          ...(body ? [{ k: t("m.alerts.detail.detail", undefined, "Detail"), v: body, full: true }] : []),
        ]}
        sections={[
          {
            h: t("m.alerts.detail.timeline", undefined, "Timeline"),
            timeline: [
              {
                icon: "Bell",
                txt: t("m.alerts.detail.delivered", undefined, "Notification Delivered"),
                time: received,
              },
              ...(readAt
                ? [
                    {
                      icon: "Eye",
                      txt: t("m.alerts.detail.readByYou", undefined, "Read By You"),
                      time: readAt,
                    },
                  ]
                : []),
            ],
          },
        ]}
        actions={[
          ...(relatedHref
            ? [
                {
                  label: t("m.alerts.detail.openRelated", undefined, "Open Related Record"),
                  icon: "ExternalLink",
                  primary: true,
                  on: () => router.push(relatedHref),
                },
              ]
            : []),
          ...(!isRead
            ? [
                {
                  label: t("m.alerts.detail.markRead", undefined, "Mark Read"),
                  icon: "Check",
                  primary: !relatedHref,
                  on: () => send(markNotificationRead),
                },
              ]
            : []),
          {
            label: t("m.alerts.detail.mute", undefined, "Mute This Type"),
            icon: "BellOff",
            on: () => router.push("/m/settings/notifications"),
          },
          {
            label: t("m.alerts.detail.dismiss", undefined, "Dismiss"),
            icon: "X",
            danger: true,
            confirmText: t("m.alerts.detail.dismissConfirm", undefined, "Dismiss this notification?"),
            on: () =>
              send(dismissNotification, () => {
                router.push("/m/notifications");
              }),
          },
        ]}
        onClose={() => router.push("/m/notifications")}
      />
    </div>
  );
}
