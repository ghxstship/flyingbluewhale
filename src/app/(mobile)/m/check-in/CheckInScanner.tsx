"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAnnounce } from "@/components/ui/LiveRegion";
import { EmptyState } from "@/components/ui/EmptyState";
import { haptic } from "@/lib/haptics";
import { useFormatters, useT } from "@/lib/i18n/LocaleProvider";
import { CameraScanner, type ScannedCode } from "@/components/scanners";
import { usePendingCount } from "@/lib/offline/queue-status";

type ScanData =
  | { result: "accepted"; ticketId: string; holderName: string | null; tier: string }
  | { result: "duplicate"; ticketId: string; scannedAt: string }
  | { result: "voided"; ticketId: string }
  | { result: "not_found" };

type ScanResp =
  // 202 shim from the service worker — scan captured offline, queued
  // for background-sync replay.
  | { ok: true; queued: true }
  | { ok: true; queued?: undefined; data: ScanData }
  | { ok: false; error: { message: string } };

type LogEntry = {
  at: string;
  code: string;
  result: "accepted" | "duplicate" | "voided" | "not_found" | "queued";
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
  const t = useT();
  const { count: pendingCount, refresh: refreshPending } = usePendingCount("/api/v1/scan");

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
          const res = await fetch(`/api/v1/scan`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ code: trimmed, location }),
          });
          const json = (await res.json()) as ScanResp;

          if (!json.ok) {
            haptic("error");
            announce(
              t("m.checkIn.announce.error", { message: json.error.message }, `Error: ${json.error.message}`),
              "assertive",
            );
            toast.error(json.error.message);
            setLog((l) =>
              [{ at: new Date().toISOString(), code: trimmed, result: "not_found" as const }, ...l].slice(0, 50),
            );
          } else if (json.queued) {
            // Service worker queued the scan offline — it will replay on
            // reconnect. Distinct state: not a verified accept.
            haptic("warning");
            const msg = t("m.offline.queuedToast", undefined, "Queued — will sync when online");
            announce(msg, "polite");
            toast.info(msg);
            setLog((l) =>
              [{ at: new Date().toISOString(), code: trimmed, result: "queued" as const }, ...l].slice(0, 50),
            );
          } else {
            const result = json.data.result;
            if (result === "accepted") {
              haptic("success");
              const name =
                "holderName" in json.data
                  ? (json.data.holderName ?? t("m.checkIn.guest", undefined, "Guest"))
                  : t("m.checkIn.guest", undefined, "Guest");
              announce(t("m.checkIn.announce.accepted", { name }, `Accepted: ${name}`), "polite");
              toast.success(name);
            } else if (result === "duplicate") {
              haptic("warning");
              announce(t("m.checkIn.announce.duplicate", undefined, "Duplicate ticket — already scanned"), "assertive");
              toast.error(t("m.checkIn.toast.alreadyScanned", undefined, "Already scanned"));
            } else if (result === "voided") {
              haptic("error");
              announce(t("m.checkIn.announce.voided", undefined, "Voided ticket — denied"), "assertive");
              toast.error(t("m.checkIn.toast.voided", undefined, "Voided ticket"));
            } else {
              haptic("error");
              announce(t("m.checkIn.announce.notFound", undefined, "Ticket not found"), "assertive");
              toast.error(t("m.checkIn.toast.notFound", undefined, "Not found"));
            }
            const entry: LogEntry = { at: new Date().toISOString(), code: trimmed, result };
            setLog((l) => [entry, ...l].slice(0, 50));
          }
        } catch (e) {
          toast.error(e instanceof Error ? e.message : t("m.checkIn.toast.networkError", undefined, "Network error"));
        } finally {
          refreshPending();
          setCode("");
          // Only steal focus when keyboard-wedge mode is active so the camera
          // preview isn't blurred by an invisible <input>.
          if (mode === "wedge") inputRef.current?.focus();
        }
      });
    },
    [announce, mode, refreshPending, t],
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
    queued: 0,
  } as Record<LogEntry["result"], number>);

  return (
    <div className="space-y-4">
      <div className="card-elevated p-4">
        <div className="grid grid-cols-4 gap-2 text-center">
          {[
            {
              key: "ok",
              label: t("m.checkIn.counts.ok", undefined, "OK"),
              value: counts.accepted,
              variant: "success" as const,
            },
            {
              key: "dup",
              label: t("m.checkIn.counts.dup", undefined, "Dup"),
              value: counts.duplicate,
              variant: "warning" as const,
            },
            {
              key: "void",
              label: t("m.checkIn.counts.void", undefined, "Void"),
              value: counts.voided,
              variant: "error" as const,
            },
            {
              key: "miss",
              label: t("m.checkIn.counts.miss", undefined, "Miss"),
              value: counts.not_found,
              variant: "muted" as const,
            },
          ].map((s) => (
            <div key={s.key}>
              <div className="text-display text-2xl">{s.value}</div>
              <Badge variant={s.variant}>{s.label}</Badge>
            </div>
          ))}
        </div>
        {pendingCount > 0 && (
          <div className="mt-3 text-center">
            <Badge variant="warning">
              {t("m.offline.pendingBadge", { count: pendingCount }, `${pendingCount} Pending — Will Sync When Online`)}
            </Badge>
          </div>
        )}
      </div>

      <div
        role="tablist"
        aria-label={t("m.checkIn.tablist.ariaLabel", undefined, "Scanner Input Mode")}
        className="card-elevated grid grid-cols-2 gap-1 p-1"
      >
        <button
          type="button"
          role="tab"
          aria-selected={mode === "wedge"}
          onClick={() => setModePersisted("wedge")}
          className={`text-label rounded px-3 py-2 text-xs ${
            mode === "wedge"
              ? "bg-[var(--color-bg-inset)] text-[var(--color-text-primary)]"
              : "text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
          }`}
        >
          {t("m.checkIn.mode.wedge", undefined, "Keyboard Wedge")}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "camera"}
          onClick={() => setModePersisted("camera")}
          className={`text-label rounded px-3 py-2 text-xs ${
            mode === "camera"
              ? "bg-[var(--color-bg-inset)] text-[var(--color-text-primary)]"
              : "text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
          }`}
        >
          {t("m.checkIn.mode.camera", undefined, "Camera")}
        </button>
      </div>

      {mode === "wedge" ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit(code);
          }}
          className="card-elevated p-4"
        >
          <label className="text-label text-[var(--color-text-tertiary)]">
            {t("m.checkIn.ticketCode", undefined, "Ticket Code")}
          </label>
          <input
            ref={inputRef}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            inputMode="text"
            autoComplete="off"
            autoCapitalize="characters"
            placeholder={t("m.checkIn.placeholder", undefined, "Scan or type")}
            className="input text-mono mt-1.5 w-full text-base"
            disabled={pending}
          />
          <div className="mt-3 flex gap-2">
            <Button type="submit" size="lg" className="flex-1" disabled={pending || !code}>
              {pending
                ? t("m.checkIn.validating", undefined, "Validating…")
                : t("m.checkIn.validate", undefined, "Validate")}
            </Button>
          </div>
        </form>
      ) : (
        <div className="card-elevated p-4">
          <label className="text-label text-[var(--color-text-tertiary)]">
            {t("m.checkIn.ticketCode", undefined, "Ticket Code")}
          </label>
          <div className="mt-1.5">
            <CameraScanner onScan={handleCameraScan} formats={["qr_code", "code_128"]} />
          </div>
          <p className="text-mono mt-2 text-[11px] text-[var(--color-text-tertiary)]">
            {t("m.checkIn.camera.hint", undefined, "Point at a ticket QR. Validates automatically on detect.")}
          </p>
        </div>
      )}

      <div className="card-elevated">
        <div className="text-heading border-b border-[var(--color-border)] px-4 py-3 text-sm">
          {t("m.checkIn.recent", undefined, "Recent")}
        </div>
        {log.length === 0 ? (
          <EmptyState size="compact" title={t("m.checkIn.empty.title", undefined, "No Scans Yet")} />
        ) : (
          <ul>
            {log.map((e, i) => (
              <li
                key={i}
                className="text-mono flex items-center justify-between border-b border-[var(--color-border-subtle)] px-4 py-2 text-xs"
              >
                <span className="text-[var(--color-text-primary)]">{e.code}</span>
                <span className="flex items-center gap-2 text-[var(--color-text-tertiary)]">
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
                    {e.result === "accepted"
                      ? t("m.checkIn.result.accepted", undefined, "accepted")
                      : e.result === "duplicate"
                        ? t("m.checkIn.result.duplicate", undefined, "duplicate")
                        : e.result === "voided"
                          ? t("m.checkIn.result.voided", undefined, "voided")
                          : e.result === "queued"
                            ? t("m.offline.queuedBadge", undefined, "Queued")
                            : t("m.checkIn.result.notFound", undefined, "not_found")}
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
