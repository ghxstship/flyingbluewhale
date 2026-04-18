"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAnnounce } from "@/components/ui/LiveRegion";
import { haptic } from "@/lib/haptics";

type ScanResp =
  | { ok: true; data: { result: "accepted"; ticketId: string; holderName: string | null; tier: string } }
  | { ok: true; data: { result: "duplicate"; ticketId: string; scannedAt: string } }
  | { ok: true; data: { result: "voided"; ticketId: string } }
  | { ok: true; data: { result: "not_found" } }
  | { ok: false; error: { message: string } };

type LogEntry = {
  at: string;
  code: string;
  result: "accepted" | "duplicate" | "voided" | "not_found";
};

export function CheckInScanner() {
  const [code, setCode] = useState("");
  const [log, setLog] = useState<LogEntry[]>([]);
  const [pending, start] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const announce = useAnnounce();

  useEffect(() => { inputRef.current?.focus(); }, []);

  const submit = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return;
    start(async () => {
      let location: { lat: number; lng: number; accuracy?: number } | undefined;
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          if (!navigator.geolocation) return reject(new Error("no geolocation"));
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 2000, enableHighAccuracy: false });
        });
        location = { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy };
      } catch { /* optional */ }

      try {
        const res = await fetch(`/api/v1/tickets/scan`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ code: trimmed, location }),
        });
        const json = (await res.json()) as ScanResp;

        if (!json.ok) {
          haptic("error");
          announce(`Error: ${json.error.message}`, "assertive");
          toast.error(json.error.message);
          setLog((l) => [{ at: new Date().toISOString(), code: trimmed, result: "not_found" as const }, ...l].slice(0, 50));
        } else {
          const result = json.data.result;
          if (result === "accepted") {
            haptic("success");
            const name = "holderName" in json.data ? (json.data.holderName ?? "Guest") : "Guest";
            announce(`Accepted: ${name}`, "polite");
            toast.success(`✓ ${name}`);
          } else if (result === "duplicate") {
            haptic("warning");
            announce("Duplicate ticket — already scanned", "assertive");
            toast.error("Already scanned");
          } else if (result === "voided") {
            haptic("error");
            announce("Voided ticket — denied", "assertive");
            toast.error("Voided ticket");
          } else {
            haptic("error");
            announce("Ticket not found", "assertive");
            toast.error("Not found");
          }
          const entry: LogEntry = { at: new Date().toISOString(), code: trimmed, result };
          setLog((l) => [entry, ...l].slice(0, 50));
        }
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Network error");
      } finally {
        setCode("");
        inputRef.current?.focus();
      }
    });
  };

  const counts = log.reduce(
    (acc, e) => ((acc[e.result]++), acc),
    { accepted: 0, duplicate: 0, voided: 0, not_found: 0 } as Record<LogEntry["result"], number>,
  );

  return (
    <div className="space-y-4">
      <div className="card-elevated p-4">
        <div className="grid grid-cols-4 gap-2 text-center">
          {[
            { label: "OK", value: counts.accepted, variant: "success" as const },
            { label: "Dup", value: counts.duplicate, variant: "warning" as const },
            { label: "Void", value: counts.voided, variant: "error" as const },
            { label: "Miss", value: counts.not_found, variant: "muted" as const },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-display text-2xl">{s.value}</div>
              <Badge variant={s.variant}>{s.label}</Badge>
            </div>
          ))}
        </div>
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); submit(code); }}
        className="card-elevated p-4"
      >
        <label className="text-label text-[var(--color-text-tertiary)]">Ticket code</label>
        <input
          ref={inputRef}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          inputMode="text"
          autoComplete="off"
          autoCapitalize="characters"
          placeholder="Scan or type"
          className="input mt-1.5 w-full text-mono text-base"
          disabled={pending}
        />
        <div className="mt-3 flex gap-2">
          <Button type="submit" size="lg" className="flex-1" disabled={pending || !code}>
            {pending ? "Validating…" : "Validate"}
          </Button>
        </div>
      </form>

      <div className="card-elevated">
        <div className="border-b border-[var(--color-border)] px-4 py-3 text-heading text-sm">Recent</div>
        {log.length === 0 ? (
          <div className="px-4 py-6 text-center text-mono text-xs text-[var(--color-text-tertiary)]">
            No scans yet
          </div>
        ) : (
          <ul>
            {log.map((e, i) => (
              <li key={i} className="flex items-center justify-between border-b border-[var(--color-border-subtle)] px-4 py-2 text-mono text-xs">
                <span className="text-[var(--color-text-primary)]">{e.code}</span>
                <span className="flex items-center gap-2 text-[var(--color-text-tertiary)]">
                  {new Date(e.at).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  <Badge
                    variant={
                      e.result === "accepted" ? "success" :
                      e.result === "duplicate" ? "warning" :
                      e.result === "voided" ? "error" : "muted"
                    }
                  >
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
