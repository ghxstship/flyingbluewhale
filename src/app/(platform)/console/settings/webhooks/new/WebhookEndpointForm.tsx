"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const EVENT_OPTIONS = [
  "*",
  "project.created", "project.status_changed",
  "invoice.sent", "invoice.paid",
  "proposal.sent", "proposal.signed",
  "deliverable.submitted", "deliverable.approved",
  "ticket.scanned",
  "po.acknowledged", "po.fulfilled",
  "incident.filed",
  "passkey.registered",
  "account.deletion_requested",
];

export function WebhookEndpointForm() {
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
      toast.error("URL must start with https://");
      return;
    }
    if (events.size === 0) {
      toast.error("Pick at least one event");
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
        toast.error(body?.error?.message ?? "Create failed");
        return;
      }
      setCreatedSecret(body.data.secret as string);
      toast.success("Endpoint registered");
    });
  }

  if (createdSecret) {
    return (
      <div className="surface p-5">
        <h3 className="text-sm font-semibold">Signing secret</h3>
        <p className="mt-2 text-xs text-[var(--text-muted)]">
          Copy this now. It's shown once and never surfaces again.
        </p>
        <div className="mt-3 flex gap-2">
          <pre className="flex-1 overflow-x-auto rounded bg-[var(--surface-inset)] p-3 font-mono text-xs">
            {createdSecret}
          </pre>
          <Button
            type="button"
            onClick={async () => {
              await navigator.clipboard.writeText(createdSecret);
              toast.success("Copied");
            }}
          >
            Copy
          </Button>
        </div>
        <p className="mt-4 text-xs text-[var(--text-muted)]">
          Every delivery carries <code className="font-mono">x-fbw-signature: t=&lt;ms&gt;,v1=&lt;hex&gt;</code>{" "}
          where <code className="font-mono">hex = HMAC-SHA256(t + "." + body, secret)</code>. Stripe-style.
        </p>
        <div className="mt-4 flex justify-end">
          <Button onClick={() => router.push("/console/settings/webhooks")}>Done</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Input
        label="Endpoint URL"
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://example.com/webhooks/flyingbluewhale"
        required
      />
      <Input
        label="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Production — routes to PagerDuty on incidents"
      />
      <div>
        <label className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
          Events
        </label>
        <div className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {EVENT_OPTIONS.map((ev) => (
            <label
              key={ev}
              className={`flex cursor-pointer items-center gap-2 rounded border border-[var(--border-color)] px-3 py-1.5 text-xs ${
                events.has(ev) ? "bg-[var(--surface-inset)]" : ""
              }`}
            >
              <input
                type="checkbox"
                checked={events.has(ev)}
                onChange={() => toggle(ev)}
              />
              <span className="font-mono">{ev}</span>
            </label>
          ))}
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" href="/console/settings/webhooks">
          Cancel
        </Button>
        <Button type="button" onClick={submit} disabled={isPending}>
          {isPending ? "Registering…" : "Register endpoint"}
        </Button>
      </div>
    </div>
  );
}
