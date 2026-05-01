"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAnnounce } from "@/components/ui/LiveRegion";
import { EmptyState } from "@/components/ui/EmptyState";
import { haptic } from "@/lib/haptics";

type ScanRecord = {
  id: string;
  result: "allow" | "deny" | "warn";
  reason: string | null;
  scanned_at: string;
};

type ScanResp = { ok: true; data: { scan: ScanRecord } } | { ok: false; error: { message: string } };

type LogEntry = {
  at: string;
  barcode: string;
  result: "allow" | "deny" | "warn";
  detail: string;
};

/**
 * Mobile gate scanner — keyboard-wedge friendly. Reads a barcode and POSTs
 * to /api/v1/accreditation/scan. Shows allow/deny with a reason and keeps a
 * recent-scans list. The endpoint records each decision server-side.
 */
export function GateScanner() {
  const [barcode, setBarcode] = useState("");
  const [log, setLog] = useState<LogEntry[]>([]);
  const [pending, start] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const announce = useAnnounce();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const submit = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return;
    start(async () => {
      try {
        const res = await fetch("/api/v1/accreditation/scan", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ barcode: trimmed }),
        });
        const json = (await res.json()) as ScanResp;

        if (!json.ok) {
          haptic("error");
          announce(`Error: ${json.error.message}`, "assertive");
          toast.error(json.error.message);
        } else {
          const { result, reason } = json.data.scan;
          if (result === "allow") {
            haptic("success");
            announce("Allow", "polite");
            toast.success("✓ Allow");
          } else if (result === "warn") {
            haptic("warning");
            announce(`Warn: ${reason ?? "review"}`, "assertive");
            toast.warning(`⚠ ${reason ?? "review"}`);
          } else {
            haptic("error");
            announce(`Deny: ${reason ?? "denied"}`, "assertive");
            toast.error(`✗ ${reason ?? "denied"}`);
          }
          setLog((l) =>
            [
              {
                at: new Date().toISOString(),
                barcode: trimmed,
                result,
                detail: reason ?? (result === "allow" ? "ok" : "denied"),
              },
              ...l,
            ].slice(0, 50),
          );
        }
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Network error");
      } finally {
        setBarcode("");
        inputRef.current?.focus();
      }
    });
  };

  const counts = log.reduce((acc, e) => (acc[e.result]++, acc), { allow: 0, deny: 0, warn: 0 } as Record<
    LogEntry["result"],
    number
  >);

  return (
    <div className="space-y-4">
      <div className="card-elevated p-4">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-display text-2xl">{counts.allow}</div>
            <Badge variant="success">Allow</Badge>
          </div>
          <div>
            <div className="text-display text-2xl">{counts.warn}</div>
            <Badge variant="warning">Warn</Badge>
          </div>
          <div>
            <div className="text-display text-2xl">{counts.deny}</div>
            <Badge variant="error">Deny</Badge>
          </div>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(barcode);
        }}
        className="card-elevated p-4"
      >
        <label className="text-label text-[var(--color-text-tertiary)]">Card Barcode</label>
        <input
          ref={inputRef}
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
          inputMode="text"
          autoComplete="off"
          autoCapitalize="characters"
          placeholder="Scan or type"
          className="input text-mono mt-1.5 w-full text-base"
          disabled={pending}
        />
        <div className="mt-3 flex gap-2">
          <Button type="submit" size="lg" className="flex-1" disabled={pending || !barcode}>
            {pending ? "Validating…" : "Validate"}
          </Button>
        </div>
      </form>

      <div className="card-elevated">
        <div className="text-heading border-b border-[var(--color-border)] px-4 py-3 text-sm">Recent</div>
        {log.length === 0 ? (
          <EmptyState size="compact" title="No Scans Yet" />
        ) : (
          <ul>
            {log.map((e, i) => (
              <li
                key={i}
                className="text-mono flex items-center justify-between border-b border-[var(--color-border-subtle)] px-4 py-2 text-xs"
              >
                <span className="flex flex-col">
                  <span className="text-[var(--color-text-primary)]">{e.barcode}</span>
                  <span className="text-[var(--color-text-tertiary)]">{e.detail}</span>
                </span>
                <span className="flex items-center gap-2 text-[var(--color-text-tertiary)]">
                  {new Date(e.at).toLocaleTimeString(undefined, {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                  <Badge variant={e.result === "allow" ? "success" : e.result === "warn" ? "warning" : "error"}>
                    {e.result}
                  </Badge>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
