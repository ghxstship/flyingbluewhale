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
  const t = useT();

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
            announce(
              t("m.gate.scan.announce.error", { message: json.error.message }, `Error: ${json.error.message}`),
              "assertive",
            );
            toast.error(json.error.message);
          } else {
            const { result, reason } = json.data.scan;
            if (result === "allow") {
              haptic("success");
              announce(t("m.gate.scan.result.allow", undefined, "Allow"), "polite");
              toast.success(t("m.gate.scan.result.allow", undefined, "Allow"));
            } else if (result === "warn") {
              haptic("warning");
              const warnReason = reason ?? t("m.gate.scan.reason.review", undefined, "review");
              announce(t("m.gate.scan.announce.warn", { reason: warnReason }, `Warn: ${warnReason}`), "assertive");
              toast.warning(warnReason);
            } else {
              haptic("error");
              const denyReason = reason ?? t("m.gate.scan.reason.denied", undefined, "denied");
              announce(t("m.gate.scan.announce.deny", { reason: denyReason }, `Deny: ${denyReason}`), "assertive");
              toast.error(denyReason);
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
          toast.error(e instanceof Error ? e.message : t("common.networkError", undefined, "Network error"));
        } finally {
          setBarcode("");
          if (mode === "wedge") inputRef.current?.focus();
        }
      });
    },
    [announce, mode, t],
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
      <div className="card-elevated p-4">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-display text-2xl">{counts.allow}</div>
            <Badge variant="success">{t("m.gate.scan.badge.allow", undefined, "Allow")}</Badge>
          </div>
          <div>
            <div className="text-display text-2xl">{counts.warn}</div>
            <Badge variant="warning">{t("m.gate.scan.badge.warn", undefined, "Warn")}</Badge>
          </div>
          <div>
            <div className="text-display text-2xl">{counts.deny}</div>
            <Badge variant="error">{t("m.gate.scan.badge.deny", undefined, "Deny")}</Badge>
          </div>
        </div>
      </div>

      <div
        role="tablist"
        aria-label={t("m.gate.scan.mode.ariaLabel", undefined, "Scanner Input Mode")}
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
          {t("m.gate.scan.mode.wedge", undefined, "Keyboard Wedge")}
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
          {t("m.gate.scan.mode.camera", undefined, "Camera")}
        </button>
      </div>

      {mode === "wedge" ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit(barcode);
          }}
          className="card-elevated p-4"
        >
          <label className="text-label text-[var(--color-text-tertiary)]">
            {t("m.gate.scan.cardBarcode.label", undefined, "Card Barcode")}
          </label>
          <input
            ref={inputRef}
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            inputMode="text"
            autoComplete="off"
            autoCapitalize="characters"
            placeholder={t("m.gate.scan.cardBarcode.placeholder", undefined, "Scan or type")}
            className="input text-mono mt-1.5 w-full text-base"
            disabled={pending}
          />
          <div className="mt-3 flex gap-2">
            <Button type="submit" size="lg" className="flex-1" disabled={pending || !barcode}>
              {pending
                ? t("m.gate.scan.validating", undefined, "Validating…")
                : t("m.gate.scan.validate", undefined, "Validate")}
            </Button>
          </div>
        </form>
      ) : (
        <div className="card-elevated p-4">
          <label className="text-label text-[var(--color-text-tertiary)]">
            {t("m.gate.scan.cardBarcode.label", undefined, "Card Barcode")}
          </label>
          <div className="mt-1.5">
            <CameraScanner onScan={handleCameraScan} formats={["qr_code", "code_128"]} />
          </div>
          <p className="text-mono mt-2 text-[11px] text-[var(--color-text-tertiary)]">
            {t(
              "m.gate.scan.camera.hint",
              undefined,
              "Point at a credential barcode. Validates automatically on detect.",
            )}
          </p>
        </div>
      )}

      <div className="card-elevated">
        <div className="text-heading border-b border-[var(--color-border)] px-4 py-3 text-sm">
          {t("m.gate.scan.recent", undefined, "Recent")}
        </div>
        {log.length === 0 ? (
          <EmptyState size="compact" title={t("m.gate.scan.empty.title", undefined, "No Scans Yet")} />
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
                  {fmt.time(e.at, { seconds: true })}
                  <Badge variant={e.result === "allow" ? "success" : e.result === "warn" ? "warning" : "error"}>
                    {e.result === "allow"
                      ? t("m.gate.scan.badge.allow", undefined, "Allow")
                      : e.result === "warn"
                        ? t("m.gate.scan.badge.warn", undefined, "Warn")
                        : t("m.gate.scan.badge.deny", undefined, "Deny")}
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
