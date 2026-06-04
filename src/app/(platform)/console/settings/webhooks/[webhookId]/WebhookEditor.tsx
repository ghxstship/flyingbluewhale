"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
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
  const t = useT();
  const router = useRouter();
  const [url, setUrl] = useState(initialUrl);
  const [description, setDescription] = useState(initialDescription);
  const [events, setEvents] = useState<Set<string>>(new Set(initialEvents));
  const [isActive, setActive] = useState(initialActive);
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDelete] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);

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
      toast.error(t("console.settings.webhooks.editor.urlMustBeHttps", undefined, "URL must start with https://"));
      return;
    }
    if (events.size === 0) {
      toast.error(t("console.settings.webhooks.editor.pickAtLeastOne", undefined, "Pick at least one event"));
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
        toast.error(body?.error?.message ?? t("console.settings.webhooks.editor.saveFailed", undefined, "Save failed"));
        return;
      }
      toast.success(t("console.settings.webhooks.editor.savedToast", undefined, "Saved"));
      router.refresh();
    });
  }

  function remove() {
    startDelete(async () => {
      const res = await fetch(`/api/v1/webhooks/endpoints/${id}`, { method: "DELETE" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.ok) {
        toast.error(
          body?.error?.message ?? t("console.settings.webhooks.editor.deleteFailed", undefined, "Delete failed"),
        );
        return;
      }
      toast.success(t("console.settings.webhooks.editor.deletedToast", undefined, "Endpoint deleted"));
      router.push("/console/settings/webhooks");
    });
  }

  return (
    <div className="surface space-y-4 p-5">
      <Input
        label={t("console.settings.webhooks.editor.endpointUrlLabel", undefined, "Endpoint URL")}
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />
      <Input
        label={t("console.settings.webhooks.editor.descriptionLabel", undefined, "Description")}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={isActive} onChange={(e) => setActive(e.target.checked)} />
        <span>
          {t("console.settings.webhooks.editor.activeLabel", undefined, "Active — deliver events to this endpoint")}
        </span>
      </label>

      <div>
        <label className="text-xs font-medium tracking-wider text-[var(--text-muted)] uppercase">
          {t("console.settings.webhooks.editor.eventsLabel", undefined, "Events")}
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
        <Button variant="danger" onClick={() => setConfirmOpen(true)} disabled={isDeleting}>
          {isDeleting
            ? t("console.settings.webhooks.editor.deleting", undefined, "Deleting…")
            : t("console.settings.webhooks.editor.deleteEndpoint", undefined, "Delete endpoint")}
        </Button>
        <Button onClick={save} disabled={isPending}>
          {isPending
            ? t("console.settings.webhooks.editor.saving", undefined, "Saving…")
            : t("console.settings.webhooks.editor.saveChanges", undefined, "Save changes")}
        </Button>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>
              {t("console.settings.webhooks.editor.confirmTitle", undefined, "Delete webhook endpoint?")}
            </DialogTitle>
            <DialogDescription>
              {t(
                "console.settings.webhooks.editor.confirmDescription",
                undefined,
                "Deliveries stop immediately. The signing secret cannot be recovered — a replacement endpoint gets a new one.",
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmOpen(false)}>
              {t("common.cancel", undefined, "Cancel")}
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                setConfirmOpen(false);
                remove();
              }}
              disabled={isDeleting}
            >
              {isDeleting
                ? t("console.settings.webhooks.editor.deleting", undefined, "Deleting…")
                : t("console.settings.webhooks.editor.deleteEndpoint", undefined, "Delete endpoint")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
