"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAnnounce } from "@/components/ui/LiveRegion";
import { haptic } from "@/lib/haptics";
import { toTitle } from "@/lib/format";
import { useT } from "@/lib/i18n/LocaleProvider";
import { usePendingCount } from "@/lib/offline/queue-status";

type Entry = {
  at: string;
  tag: string;
  name: string | null;
  previous: string | null;
  status: string | null;
  result: "ok" | "not_found" | "error" | "queued";
  error?: string;
};

export function InventoryScanner() {
  const t = useT();
  const [tag, setTag] = useState("");
  const [log, setLog] = useState<Entry[]>([]);
  const [pending, startTransition] = useTransition();
  const announce = useAnnounce();
  const { count: pendingCount, refresh: refreshPending } = usePendingCount("/api/v1/equipment/scan");

  function submit(raw: string, action: "toggle" | "check_in" | "check_out" = "toggle") {
    const trimmed = raw.trim();
    if (!trimmed) return;
    startTransition(async () => {
      try {
        const res = await fetch("/api/v1/equipment/scan", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ assetTag: trimmed, action }),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok || !body.ok) {
          setLog((l) =>
            [
              {
                at: new Date().toISOString(),
                tag: trimmed,
                name: null,
                previous: null,
                status: null,
                result: "error" as const,
                error: body?.error?.message ?? `HTTP ${res.status}`,
              },
              ...l,
            ].slice(0, 50),
          );
          toast.error(body?.error?.message ?? t("m.inventory.scan.toast.failed", undefined, "Scan failed"));
          haptic("error");
          return;
        }
        if (body.queued) {
          // Service worker queued the scan offline — it will replay on
          // reconnect. Distinct state: the toggle hasn't landed yet.
          haptic("warning");
          const msg = t("m.offline.queuedToast", undefined, "Queued — will sync when online");
          announce(msg, "polite");
          toast.info(msg);
          setLog((l) =>
            [
              {
                at: new Date().toISOString(),
                tag: trimmed,
                name: null,
                previous: null,
                status: null,
                result: "queued" as const,
              },
              ...l,
            ].slice(0, 50),
          );
          setTag("");
          return;
        }
        const data = body.data as {
          result: string;
          name?: string;
          assetTag?: string;
          previousStatus?: string;
          status?: string;
        };
        if (data.result === "not_found") {
          setLog((l) =>
            [
              {
                at: new Date().toISOString(),
                tag: trimmed,
                name: null,
                previous: null,
                status: null,
                result: "not_found" as const,
              },
              ...l,
            ].slice(0, 50),
          );
          announce(t("m.inventory.scan.announce.notFound", undefined, "Asset not found"), "assertive");
          toast.error(t("m.inventory.scan.toast.notFound", undefined, "No equipment with that tag"));
          haptic("error");
        } else {
          setLog((l) =>
            [
              {
                at: new Date().toISOString(),
                tag: trimmed,
                name: data.name ?? null,
                previous: data.previousStatus ?? null,
                status: data.status ?? null,
                result: "ok" as const,
              },
              ...l,
            ].slice(0, 50),
          );
          announce(
            t(
              "m.inventory.scan.announce.statusChanged",
              { name: data.name ?? "", status: data.status ?? "" },
              `${data.name} is now ${data.status}`,
            ),
            "polite",
          );
          toast.success(`${data.name} → ${data.status}`);
          haptic("success");
        }
        setTag("");
      } catch (err) {
        setLog((l) =>
          [
            {
              at: new Date().toISOString(),
              tag: trimmed,
              name: null,
              previous: null,
              status: null,
              result: "error" as const,
              error: (err as Error).message,
            },
            ...l,
          ].slice(0, 50),
        );
        toast.error((err as Error).message);
      } finally {
        refreshPending();
      }
    });
  }

  return (
    <div className="space-y-4">
      {pendingCount > 0 && (
        <div className="card-elevated p-3 text-center">
          <Badge variant="warning">
            {t("m.offline.pendingBadge", { count: pendingCount }, `${pendingCount} Pending — Will Sync When Online`)}
          </Badge>
        </div>
      )}
      <form
        className="card-elevated space-y-3 p-4"
        onSubmit={(e) => {
          e.preventDefault();
          submit(tag);
        }}
      >
        <label className="text-label text-[var(--color-text-tertiary)]">
          {t("m.inventory.scan.assetTag", undefined, "Asset Tag")}
        </label>
        <input
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          inputMode="text"
          autoFocus
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          placeholder={t("m.inventory.scan.placeholder", undefined, "Scan or type")}
          className="ps-input w-full font-mono text-lg tracking-wider"
        />
        <div className="flex gap-2">
          <Button type="submit" size="lg" className="flex-1" disabled={pending || !tag}>
            {pending
              ? t("common.processing", undefined, "Processing…")
              : t("m.inventory.scan.toggle", undefined, "Toggle")}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="lg"
            disabled={pending || !tag}
            onClick={() => submit(tag, "check_in")}
          >
            {t("m.inventory.scan.checkIn", undefined, "Check in")}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="lg"
            disabled={pending || !tag}
            onClick={() => submit(tag, "check_out")}
          >
            {t("m.inventory.scan.checkOut", undefined, "Check out")}
          </Button>
        </div>
      </form>

      <div className="card-elevated">
        <div className="text-heading border-b border-[var(--color-border)] px-4 py-3 text-sm">
          {t("m.inventory.scan.recent", undefined, "Recent")}
        </div>
        {log.length === 0 ? (
          <EmptyState size="compact" title={t("m.inventory.scan.empty.title", undefined, "No Scans Yet")} />
        ) : (
          <ul>
            {log.map((e, i) => (
              <li
                key={i}
                className="text-mono flex items-center justify-between border-b border-[var(--color-border-subtle)] px-4 py-2 text-xs"
              >
                <span className="font-mono text-[var(--color-text-primary)]">{e.tag}</span>
                <span className="flex items-center gap-2 text-[var(--color-text-tertiary)]">
                  {e.name && <span className="text-[var(--color-text-secondary)]">{e.name}</span>}
                  {e.result === "ok" && e.status && (
                    <Badge variant={e.status === "available" ? "success" : "brand"}>{toTitle(e.status)}</Badge>
                  )}
                  {e.result === "not_found" && (
                    <Badge variant="muted">{t("m.inventory.scan.badge.notFound", undefined, "not found")}</Badge>
                  )}
                  {e.result === "queued" && (
                    <Badge variant="warning">{t("m.offline.queuedBadge", undefined, "Queued")}</Badge>
                  )}
                  {e.result === "error" && (
                    <Badge variant="error">{e.error ?? t("m.inventory.scan.badge.error", undefined, "error")}</Badge>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
