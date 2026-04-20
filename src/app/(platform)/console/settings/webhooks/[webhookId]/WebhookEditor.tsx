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

export function WebhookEditor({
  id,
  initialUrl,
  initialDescription,
  initialEvents,
  initialActive,
}: {
  id: string;
  initialUrl: string;
  initialDescription: string;
  initialEvents: string[];
  initialActive: boolean;
}) {
  const router = useRouter();
  const [url, setUrl] = useState(initialUrl);
  const [description, setDescription] = useState(initialDescription);
  const [events, setEvents] = useState<Set<string>>(new Set(initialEvents));
  const [isActive, setActive] = useState(initialActive);
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDelete] = useTransition();

  function toggle(ev: string) {
    setEvents((prev) => {
      const next = new Set(prev);
      if (next.has(ev)) next.delete(ev);
      else next.add(ev);
      return next;
    });
  }

  function save() {
    if (!url.startsWith("https://")) {
      toast.error("URL must start with https://");
      return;
    }
    if (events.size === 0) {
      toast.error("Pick at least one event");
      return;
    }
    startTransition(async () => {
      const res = await fetch(`/api/v1/webhooks/endpoints/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          url,
          description: description || null,
          events: Array.from(events),
          isActive,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.ok) {
        toast.error(body?.error?.message ?? "Save failed");
        return;
      }
      toast.success("Saved");
      router.refresh();
    });
  }

  function remove() {
    if (!window.confirm("Delete this endpoint? Deliveries stop immediately; the secret can't be recovered.")) {
      return;
    }
    startDelete(async () => {
      const res = await fetch(`/api/v1/webhooks/endpoints/${id}`, { method: "DELETE" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.ok) {
        toast.error(body?.error?.message ?? "Delete failed");
        return;
      }
      toast.success("Endpoint deleted");
      router.push("/console/settings/webhooks");
    });
  }

  return (
    <div className="surface space-y-4 p-5">
      <Input
        label="Endpoint URL"
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />
      <Input
        label="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => setActive(e.target.checked)}
        />
        <span>Active — deliver events to this endpoint</span>
      </label>

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
              <input type="checkbox" checked={events.has(ev)} onChange={() => toggle(ev)} />
              <span className="font-mono">{ev}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-[var(--border-color)] pt-4">
        <Button variant="danger" onClick={remove} disabled={isDeleting}>
          {isDeleting ? "Deleting…" : "Delete endpoint"}
        </Button>
        <Button onClick={save} disabled={isPending}>
          {isPending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </div>
  );
}
