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

type ScannerMode = "wedge" | "camera";
const MODE_STORAGE_KEY = "atlvs.scanner.mode";

/**
 * Mobile gate scanner — keyboard-wedge friendly. Reads a barcode and POSTs
 * to /api/v1/accreditation/scan. Shows allow/deny with a reason and keeps a
 * recent-scans list. The endpoint records each decision server-side.
 *
 * Camera mode (BarcodeDetector / @zxing fallback) is an additive opt-in via
 * the segmented control at the top of the form. The keyboard-wedge flow is
 * preserved exactly — both inputs feed the same `submit()`.
 */
export function GateScanner() {
  const [barcode, setBarcode] = useState("");
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
              toast.success("Allow");
            } else if (result === "warn") {
              haptic("warning");
              announce(`Warn: ${reason ?? "review"}`, "assertive");
              toast.warning(reason ?? "review");
            } else {
              haptic("error");
              announce(`Deny: ${reason ?? "denied"}`, "assertive");
              toast.error(reason ?? "denied");
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

  const counts = log.reduce((acc, e) => (acc[e.result]++, acc), { allow: 0, deny: 0, warn: 0 } as Record<
    LogEntry["result"],
    number
  >);

  return (
    <div className="space-y-4">
      <div className="surface-raised p-4">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="font-display text-2xl">{counts.allow}</div>
            <Badge variant="success">Allow</Badge>
          </div>
          <div>
            <div className="font-display text-2xl">{counts.warn}</div>
            <Badge variant="warning">Warn</Badge>
          </div>
          <div>
            <div className="font-display text-2xl">{counts.deny}</div>
            <Badge variant="error">Deny</Badge>
          </div>
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
            submit(barcode);
          }}
          className="surface-raised p-4"
        >
          <label className="text-xs font-semibold tracking-wider uppercase text-[var(--text-muted)]">Card Barcode</label>
          <input
            ref={inputRef}
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            inputMode="text"
            autoComplete="off"
            autoCapitalize="characters"
            placeholder="Scan or type"
            className="input-base font-mono mt-1.5 w-full text-base"
            disabled={pending}
          />
          <div className="mt-3 flex gap-2">
            <Button type="submit" size="lg" className="flex-1" disabled={pending || !barcode}>
              {pending ? "Validating…" : "Validate"}
            </Button>
          </div>
        </form>
      ) : (
        <div className="surface-raised p-4">
          <label className="text-xs font-semibold tracking-wider uppercase text-[var(--text-muted)]">Card Barcode</label>
          <div className="mt-1.5">
            <CameraScanner onScan={handleCameraScan} formats={["qr_code", "code_128"]} />
          </div>
          <p className="font-mono mt-2 text-[11px] text-[var(--text-muted)]">
            Point at a credential barcode. Validates automatically on detect.
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
                <span className="flex flex-col">
                  <span className="text-[var(--foreground)]">{e.barcode}</span>
                  <span className="text-[var(--text-muted)]">{e.detail}</span>
                </span>
                <span className="flex items-center gap-2 text-[var(--text-muted)]">
                  {fmt.time(e.at, { seconds: true })}
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
