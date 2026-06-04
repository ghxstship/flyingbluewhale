"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BellRing, BellOff, Trash2, Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { timeAgo } from "@/lib/format";
import { useT } from "@/lib/i18n/LocaleProvider";
import {
  currentPermission,
  detectPushSupport,
  getOrCreateSubscription,
  requestPushPermission,
  unsubscribeCurrent,
} from "@/lib/push/subscribe";

export type RegisteredDevice = {
  id: string;
  endpoint: string;
  user_agent: string | null;
  created_at: string;
  last_seen_at: string;
};

type Status =
  | { kind: "idle" }
  | { kind: "info"; message: string }
  | { kind: "error"; message: string }
  | { kind: "success"; message: string };

export function PushToggle({
  vapidPublicKey,
  initialDevices,
}: {
  vapidPublicKey: string;
  initialDevices: RegisteredDevice[];
}) {
  const t = useT();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [supportReason, setSupportReason] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [devices, setDevices] = useState<RegisteredDevice[]>(initialDevices);

  useEffect(() => {
    const support = detectPushSupport();
    if (!support.supported) {
      setSupportReason(support.reason);
      return;
    }
    setPermission(currentPermission());
  }, []);

  if (supportReason) {
    return (
      <Alert kind="warning">
        {t(
          "me.notifications.push.unsupported",
          { reason: supportReason },
          "Push notifications aren't available in this browser.",
        )}{" "}
        {supportReason}
      </Alert>
    );
  }

  if (!vapidPublicKey) {
    return (
      <EmptyState
        title={t("me.notifications.push.notConfigured.title", undefined, "Push not configured")}
        description={t(
          "me.notifications.push.notConfigured.description",
          undefined,
          "A server admin must set VAPID keys before push can be enabled.",
        )}
      />
    );
  }

  async function handleEnable() {
    setStatus({ kind: "idle" });
    const granted = await requestPushPermission();
    setPermission(granted);
    if (granted !== "granted") {
      setStatus({
        kind: "error",
        message: t(
          "me.notifications.push.errors.permissionDenied",
          undefined,
          "Permission denied. You can re-enable in browser settings.",
        ),
      });
      return;
    }
    const sub = await getOrCreateSubscription(vapidPublicKey);
    if (!sub) {
      setStatus({
        kind: "error",
        message: t(
          "me.notifications.push.errors.subscribeFailed",
          undefined,
          "Couldn't subscribe with the browser's push service.",
        ),
      });
      return;
    }
    const res = await fetch("/api/v1/push/subscriptions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...sub, userAgent: navigator.userAgent.slice(0, 500) }),
    });
    if (!res.ok) {
      setStatus({
        kind: "error",
        message: t(
          "me.notifications.push.errors.serverRejected",
          undefined,
          "Server rejected the subscription. Try again.",
        ),
      });
      return;
    }
    const json = (await res.json()) as { ok: boolean; data?: { subscription: RegisteredDevice } };
    if (json.ok && json.data?.subscription) {
      setDevices((d) => {
        const without = d.filter((x) => x.endpoint !== json.data!.subscription.endpoint);
        return [json.data!.subscription, ...without];
      });
      setStatus({
        kind: "success",
        message: t("me.notifications.push.success.subscribed", undefined, "This device is now subscribed."),
      });
    }
    startTransition(() => router.refresh());
  }

  async function handleDisableThisBrowser() {
    setStatus({ kind: "idle" });
    const endpoint = await unsubscribeCurrent();
    if (!endpoint) {
      setStatus({
        kind: "info",
        message: t(
          "me.notifications.push.info.noActiveSubscription",
          undefined,
          "No active subscription on this browser.",
        ),
      });
      return;
    }
    await fetch("/api/v1/push/subscriptions", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ endpoint }),
    });
    setDevices((d) => d.filter((x) => x.endpoint !== endpoint));
    setStatus({
      kind: "success",
      message: t("me.notifications.push.success.unsubscribed", undefined, "Unsubscribed on this browser."),
    });
    startTransition(() => router.refresh());
  }

  async function handleRemoveDevice(id: string) {
    setStatus({ kind: "idle" });
    const res = await fetch("/api/v1/push/subscriptions", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) {
      setStatus({
        kind: "error",
        message: t("me.notifications.push.errors.removeFailed", undefined, "Couldn't remove device."),
      });
      return;
    }
    setDevices((d) => d.filter((x) => x.id !== id));
    setStatus({
      kind: "success",
      message: t("me.notifications.push.success.deviceRemoved", undefined, "Device removed."),
    });
    startTransition(() => router.refresh());
  }

  async function handleSendTest() {
    setStatus({ kind: "idle" });
    const res = await fetch("/api/v1/push/test", { method: "POST" });
    const json = (await res.json().catch(() => null)) as {
      ok: boolean;
      data?: { sent: number; failed: number; disabled: number };
      error?: { message: string };
    } | null;
    if (!res.ok || !json?.ok) {
      setStatus({
        kind: "error",
        message: json?.error?.message ?? t("me.notifications.push.errors.testFailed", undefined, "Test push failed."),
      });
      return;
    }
    const { sent = 0, failed = 0, disabled = 0 } = json.data ?? {};
    setStatus({
      kind: sent > 0 ? "success" : "info",
      message: t(
        "me.notifications.push.testResult",
        { sent, failed, disabled },
        `Sent: ${sent} · Failed: ${failed} · Removed: ${disabled}`,
      ),
    });
  }

  const showEnable = permission !== "granted" || devices.length === 0;

  return (
    <div className="space-y-6">
      {status.kind !== "idle" && (
        <Alert kind={status.kind === "success" ? "success" : status.kind === "error" ? "error" : "info"}>
          {status.message}
        </Alert>
      )}

      <section className="surface p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">
              {t("me.notifications.push.thisBrowser.title", undefined, "This Browser")}
            </h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              {t("me.notifications.push.thisBrowser.permissionLabel", undefined, "Permission:")}{" "}
              <Badge variant={permission === "granted" ? "success" : permission === "denied" ? "error" : "muted"}>
                {permission}
              </Badge>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {showEnable ? (
              <Button
                onClick={handleEnable}
                disabled={pending}
                aria-label={t("me.notifications.push.actions.enableAria", undefined, "Enable push notifications")}
              >
                <BellRing size={14} aria-hidden="true" />
                <span className="ms-1">{t("me.notifications.push.actions.enable", undefined, "Enable Push")}</span>
              </Button>
            ) : (
              <>
                <Button variant="secondary" onClick={handleSendTest} disabled={pending}>
                  <Send size={14} aria-hidden="true" />
                  <span className="ms-1">{t("me.notifications.push.actions.sendTest", undefined, "Send Test")}</span>
                </Button>
                <Button variant="ghost" onClick={handleDisableThisBrowser} disabled={pending}>
                  <BellOff size={14} aria-hidden="true" />
                  <span className="ms-1">{t("me.notifications.push.actions.disable", undefined, "Disable")}</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-base font-semibold">
          {t("me.notifications.push.devices.title", undefined, "Registered Devices")}
        </h2>
        {devices.length === 0 ? (
          <EmptyState
            title={t("me.notifications.push.devices.empty.title", undefined, "No devices yet")}
            description={t(
              "me.notifications.push.devices.empty.description",
              undefined,
              "Enable push on this browser to register your first device.",
            )}
          />
        ) : (
          <ul className="surface divide-y divide-[var(--border-color)]">
            {devices.map((d) => (
              <li key={d.id} className="flex items-start justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{shortUserAgent(d.user_agent, t)}</p>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    {t(
                      "me.notifications.push.devices.timestamps",
                      { lastSeen: timeAgo(d.last_seen_at), added: timeAgo(d.created_at) },
                      `Last seen ${timeAgo(d.last_seen_at)} · added ${timeAgo(d.created_at)}`,
                    )}
                  </p>
                  <p className="mt-1 truncate font-mono text-[10px] text-[var(--text-muted)]">{d.endpoint}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={t("me.notifications.push.devices.removeAria", undefined, "Remove device")}
                  onClick={() => handleRemoveDevice(d.id)}
                  disabled={pending}
                >
                  <Trash2 size={14} aria-hidden="true" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function shortUserAgent(
  ua: string | null,
  t: (key: string, vars?: Record<string, string | number>, fallback?: string) => string,
): string {
  if (!ua) return t("me.notifications.push.devices.unknown", undefined, "Unknown device");
  // Trim to a recognisable browser+OS hint without leaking the full UA.
  const browser = /(Edg|OPR|Chrome|Safari|Firefox)\/[\d.]+/.exec(ua)?.[0] ?? "Browser";
  const os = /(Mac OS X [\d_]+|Windows NT [\d.]+|Android [\d.]+|iPhone OS [\d_]+|Linux)/.exec(ua)?.[0] ?? "";
  return os ? `${browser} · ${os.replace(/_/g, ".")}` : browser;
}
