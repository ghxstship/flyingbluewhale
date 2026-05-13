"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAnnounce } from "@/components/ui/LiveRegion";
import { EmptyState } from "@/components/ui/EmptyState";
import { haptic } from "@/lib/haptics";
import { useFormatters } from "@/lib/i18n/LocaleProvider";
import { CameraScanner, type ScannedCode } from "@/components/scanners";

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

type ScannerMode = "wedge" | "camera";
const MODE_STORAGE_KEY = "atlvs.scanner.mode";

export function CheckInScanner() {
  const [code, setCode] = useState("");
  const [log, setLog] = useState<LogEntry[]>([]);
  const [pending, start] = useTransition();
  const [mode, setMode] = useState<ScannerMode>("wedge");
  const inputRef = useRef<HTMLInputElement>(null);
  const announce = useAnnounce();
  const fmt = useFormatters();

  // Hydrate mode from localStorage after mount (avoids SSR drift).
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = window.localStorage.getItem(MODE_STORAGE_KEY);
      if (stored === "camera" || stored === "wedge") setMode(stored);
    } catch {
      /* ignore */
    }
  }, []);

  // Auto-focus the keyboard-wedge input whenever that mode is active.
  useEffect(() => {
    if (mode === "wedge") inputRef.current?.focus();
  }, [mode]);

  const setModePersisted = useCallback((next: ScannerMode) => {
    setMode(next);
    try {
      if (typeof window !== "undefined") window.localStorage.setItem(MODE_STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const submit = useCallback(
    (raw: string) => {
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
        } catch {
          /* optional */
        }

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
            setLog((l) =>
              [{ at: new Date().toISOString(), code: trimmed, result: "not_found" as const }, ...l].slice(0, 50),
            );
          } else {
            const result = json.data.result;
            if (result === "accepted") {
              haptic("success");
              const name = "holderName" in json.data ? (json.data.holderName ?? "Guest") : "Guest";
              announce(`Accepted: ${name}`, "polite");
              toast.success(name);
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
          // Only steal focus when keyboard-wedge mode is active so the camera
          // preview isn't blurred by an invisible <input>.
          if (mode === "wedge") inputRef.current?.focus();
        }
      });
    },
    [announce, mode],
  );

  const handleCameraScan = useCallback(
    (scanned: ScannedCode) => {
      submit(scanned.value);
    },
    [submit],
  );

  const counts = log.reduce((acc, e) => (acc[e.result]++, acc), {
    accepted: 0,
    duplicate: 0,
    voided: 0,
    not_found: 0,
  } as Record<LogEntry["result"], number>);

  return (
    <div className="space-y-4">
      <div className="surface-raised p-4">
        <div className="grid grid-cols-4 gap-2 text-center">
          {[
            { label: "OK", value: counts.accepted, variant: "success" as const },
            { label: "Dup", value: counts.duplicate, variant: "warning" as const },
            { label: "Void", value: counts.voided, variant: "error" as const },
            { label: "Miss", value: counts.not_found, variant: "muted" as const },
          ].map((s) => (
            <div key={s.label}>
              <div className="font-display text-2xl">{s.value}</div>
              <Badge variant={s.variant}>{s.label}</Badge>
            </div>
          ))}
        </div>
      </div>

      <div role="tablist" aria-label="Scanner Input Mode" className="surface-raised grid grid-cols-2 gap-1 p-1">
        <button
          type="button"
          role="tab"
          aria-selected={mode === "wedge"}
          onClick={() => setModePersisted("wedge")}
          className={`text-xs font-semibold tracking-wider uppercase rounded px-3 py-2 ${
            mode === "wedge"
              ? "bg-[var(--surface-inset)] text-[var(--foreground)]"
              : "text-[var(--text-muted)] hover:text-[var(--foreground)]"
          }`}
        >
          Keyboard Wedge
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "camera"}
          onClick={() => setModePersisted("camera")}
          className={`text-xs font-semibold tracking-wider uppercase rounded px-3 py-2 ${
            mode === "camera"
              ? "bg-[var(--surface-inset)] text-[var(--foreground)]"
              : "text-[var(--text-muted)] hover:text-[var(--foreground)]"
          }`}
        >
          Camera
        </button>
      </div>

      {mode === "wedge" ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit(code);
          }}
          className="surface-raised p-4"
        >
          <label className="text-xs font-semibold tracking-wider uppercase text-[var(--text-muted)]">Ticket Code</label>
          <input
            ref={inputRef}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            inputMode="text"
            autoComplete="off"
            autoCapitalize="characters"
            placeholder="Scan or type"
            className="input-base font-mono mt-1.5 w-full text-base"
            disabled={pending}
          />
          <div className="mt-3 flex gap-2">
            <Button type="submit" size="lg" className="flex-1" disabled={pending || !code}>
              {pending ? "Validating…" : "Validate"}
            </Button>
          </div>
        </form>
      ) : (
        <div className="surface-raised p-4">
          <label className="text-xs font-semibold tracking-wider uppercase text-[var(--text-muted)]">Ticket Code</label>
          <div className="mt-1.5">
            <CameraScanner onScan={handleCameraScan} formats={["qr_code", "code_128"]} />
          </div>
          <p className="font-mono mt-2 text-[11px] text-[var(--text-muted)]">
            Point at a ticket QR. Validates automatically on detect.
          </p>
        </div>
      )}

      <div className="surface-raised">
        <div className="font-semibold border-b border-[var(--color-border)] px-4 py-3 text-sm">Recent</div>
        {log.length === 0 ? (
          <EmptyState size="compact" title="No Scans Yet" />
        ) : (
          <ul>
            {log.map((e, i) => (
              <li
                key={i}
                className="font-mono flex items-center justify-between border-b border-[var(--border-color)] px-4 py-2 text-xs"
              >
                <span className="text-[var(--foreground)]">{e.code}</span>
                <span className="flex items-center gap-2 text-[var(--text-muted)]">
                  {fmt.time(e.at, { seconds: true })}
                  <Badge
                    variant={
                      e.result === "accepted"
                        ? "success"
                        : e.result === "duplicate"
                          ? "warning"
                          : e.result === "voided"
                            ? "error"
                            : "muted"
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
