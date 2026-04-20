"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAnnounce } from "@/components/ui/LiveRegion";
import { haptic } from "@/lib/haptics";

type Entry = {
  at: string;
  tag: string;
  name: string | null;
  previous: string | null;
  status: string | null;
  result: "ok" | "not_found" | "error";
  error?: string;
};

export function InventoryScanner() {
  const [tag, setTag] = useState("");
  const [log, setLog] = useState<Entry[]>([]);
  const [pending, startTransition] = useTransition();
  const announce = useAnnounce();

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
          setLog((l) => [{ at: new Date().toISOString(), tag: trimmed, name: null, previous: null, status: null, result: "error" as const, error: body?.error?.message ?? `HTTP ${res.status}` }, ...l].slice(0, 50));
          toast.error(body?.error?.message ?? "Scan failed");
          haptic("error");
          return;
        }
        const data = body.data as { result: string; name?: string; assetTag?: string; previousStatus?: string; status?: string };
        if (data.result === "not_found") {
          setLog((l) => [{ at: new Date().toISOString(), tag: trimmed, name: null, previous: null, status: null, result: "not_found" as const }, ...l].slice(0, 50));
          announce("Asset not found", "assertive");
          toast.error("No equipment with that tag");
          haptic("error");
        } else {
          setLog((l) => [{ at: new Date().toISOString(), tag: trimmed, name: data.name ?? null, previous: data.previousStatus ?? null, status: data.status ?? null, result: "ok" as const }, ...l].slice(0, 50));
          announce(`${data.name} is now ${data.status}`, "polite");
          toast.success(`${data.name} → ${data.status}`);
          haptic("success");
        }
        setTag("");
      } catch (err) {
        setLog((l) => [{ at: new Date().toISOString(), tag: trimmed, name: null, previous: null, status: null, result: "error" as const, error: (err as Error).message }, ...l].slice(0, 50));
        toast.error((err as Error).message);
      }
    });
  }

  return (
    <div className="space-y-4">
      <form
        className="card-elevated p-4 space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          submit(tag);
        }}
      >
        <label className="text-label text-[var(--color-text-tertiary)]">Asset tag</label>
        <input
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          inputMode="text"
          autoFocus
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          placeholder="Scan or type"
          className="input-base w-full font-mono text-lg tracking-wider"
        />
        <div className="flex gap-2">
          <Button type="submit" size="lg" className="flex-1" disabled={pending || !tag}>
            {pending ? "Processing…" : "Toggle"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="lg"
            disabled={pending || !tag}
            onClick={() => submit(tag, "check_in")}
          >
            Check in
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="lg"
            disabled={pending || !tag}
            onClick={() => submit(tag, "check_out")}
          >
            Check out
          </Button>
        </div>
      </form>

      <div className="card-elevated">
        <div className="border-b border-[var(--color-border)] px-4 py-3 text-heading text-sm">Recent</div>
        {log.length === 0 ? (
          <EmptyState size="compact" title="No scans yet" />
        ) : (
          <ul>
            {log.map((e, i) => (
              <li
                key={i}
                className="flex items-center justify-between border-b border-[var(--color-border-subtle)] px-4 py-2 text-mono text-xs"
              >
                <span className="font-mono text-[var(--color-text-primary)]">{e.tag}</span>
                <span className="flex items-center gap-2 text-[var(--color-text-tertiary)]">
                  {e.name && <span className="text-[var(--color-text-secondary)]">{e.name}</span>}
                  {e.result === "ok" && e.status && <Badge variant={e.status === "available" ? "success" : "brand"}>{e.status}</Badge>}
                  {e.result === "not_found" && <Badge variant="muted">not found</Badge>}
                  {e.result === "error" && <Badge variant="error">{e.error ?? "error"}</Badge>}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
