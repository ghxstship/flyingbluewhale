"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useT } from "@/lib/i18n/LocaleProvider";

const EVENT_OPTIONS = [
  "*",
  "project.created",
  "project.status_changed",
  "invoice.sent",
  "invoice.paid",
  "proposal.sent",
  "proposal.signed",
  "deliverable.submitted",
  "deliverable.approved",
  "ticket.scanned",
  "po.acknowledged",
  "po.fulfilled",
  "incident.filed",
  "passkey.registered",
  "account.deletion_requested",
];

export function WebhookEndpointForm() {
  const t = useT();
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [events, setEvents] = useState<Set<string>>(new Set());
  const [createdSecret, setCreatedSecret] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function toggle(ev: string) {
    setEvents((prev) => {
      const next = new Set(prev);
      if (next.has(ev)) next.delete(ev);
      else next.add(ev);
      return next;
    });
  }

  function submit() {
    if (!url.startsWith("https://")) {
      toast.error(t("console.settings.webhooks.new.urlMustBeHttps", undefined, "URL must start with https://"));
      return;
    }
    if (events.size === 0) {
      toast.error(t("console.settings.webhooks.new.pickAtLeastOneEvent", undefined, "Pick at least one event"));
      return;
    }
    startTransition(async () => {
      const res = await fetch("/api/v1/webhooks/endpoints", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          url,
          description: description || undefined,
          events: Array.from(events),
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.ok) {
        toast.error(
          body?.error?.message ?? t("console.settings.webhooks.new.createFailed", undefined, "Create failed"),
        );
        return;
      }
      setCreatedSecret(body.data.secret as string);
      toast.success(t("console.settings.webhooks.new.endpointRegistered", undefined, "Endpoint registered"));
    });
  }

  if (createdSecret) {
    return (
      <div className="surface p-5">
        <h3 className="text-sm font-semibold">
          {t("console.settings.webhooks.new.signingSecret", undefined, "Signing Secret")}
        </h3>
        <p className="mt-2 text-xs text-[var(--p-text-2)]">
          {t(
            "console.settings.webhooks.new.copyNowHint",
            undefined,
            "Copy this now. It's shown once and never surfaces again.",
          )}
        </p>
        <div className="mt-3 flex gap-2">
          <pre className="flex-1 overflow-x-auto rounded bg-[var(--p-surface-2)] p-3 font-mono text-xs">
            {createdSecret}
          </pre>
          <Button
            type="button"
            onClick={async () => {
              await navigator.clipboard.writeText(createdSecret);
              toast.success(t("console.settings.webhooks.new.copiedToast", undefined, "Copied"));
            }}
          >
            {t("common.copy", undefined, "Copy")}
          </Button>
        </div>
        <p className="mt-4 text-xs text-[var(--p-text-2)]">
          {t("console.settings.webhooks.new.signaturePrefix", undefined, "Every delivery carries")}{" "}
          <code className="font-mono">x-atlvs-signature: t=&lt;ms&gt;,v1=&lt;hex&gt;</code>{" "}
          {t("console.settings.webhooks.new.signatureWhere", undefined, "where")}{" "}
          <code className="font-mono">hex = HMAC-SHA256(t + "." + body, secret)</code>.{" "}
          {t("console.settings.webhooks.new.signatureStripeStyle", undefined, "Stripe-style.")}
        </p>
        <div className="mt-4 flex justify-end">
          <Button onClick={() => router.push("/console/settings/webhooks")}>
            {t("common.done", undefined, "Done")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <Input
        label={t("console.settings.webhooks.new.endpointUrlLabel", undefined, "Endpoint URL")}
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://example.com/webhooks/atlvs"
        required
      />
      <Input
        label={t("console.settings.webhooks.new.descriptionLabel", undefined, "Description · Optional")}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder={t(
          "console.settings.webhooks.new.descriptionPlaceholder",
          undefined,
          "Production — routes to PagerDuty on incidents",
        )}
      />
      <div>
        <label className="text-xs font-medium tracking-wider text-[var(--p-text-2)] uppercase">
          {t("console.settings.webhooks.new.eventsLabel", undefined, "Events")}
        </label>
        <div className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {EVENT_OPTIONS.map((ev) => (
            <label
              key={ev}
              className={`flex cursor-pointer items-center gap-2 rounded border border-[var(--p-border)] px-3 py-1.5 text-xs ${
                events.has(ev) ? "bg-[var(--p-surface-2)]" : ""
              }`}
            >
              <input type="checkbox" checked={events.has(ev)} onChange={() => toggle(ev)} />
              <span className="font-mono">{ev}</span>
            </label>
          ))}
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" href="/console/settings/webhooks">
          {t("common.cancel", undefined, "Cancel")}
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending
            ? t("console.settings.webhooks.new.registering", undefined, "Registering…")
            : t("console.settings.webhooks.new.registerEndpoint", undefined, "Register endpoint")}
        </Button>
      </div>
    </form>
  );
}
