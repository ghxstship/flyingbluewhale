"use client";

import { useEffect, useRef, useState } from "react";
import * as pdfjs from "pdfjs-dist";
import { KIcon } from "@/components/mobile/kit";
import { useT } from "@/lib/i18n/LocaleProvider";

if (typeof window !== "undefined") {
  pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
}

export type PlanPin = {
  id: string;
  pin_type: string;
  label: string | null;
  x_pct: number;
  y_pct: number;
};

/**
 * On-device PDF render of a released site-plan sheet (all pages stacked),
 * with the sheet's pins overlaid on page 1 — the same single-plane semantic
 * as the console's map view.
 *
 * Offline: the fetched bytes are stored in Cache Storage under a stable
 * per-sheet key (the signed URL itself expires in 60s, so caching by URL
 * would never hit). Network first; a previously opened sheet re-renders
 * with no signal.
 */
const PLAN_CACHE = "atlvs-plans-v1";

async function fetchPlanBytes(planId: string): Promise<{ bytes: ArrayBuffer; fromCache: boolean }> {
  const cacheKey = `/__plan-cache/${planId}`;
  try {
    const res = await fetch(`/api/v1/site-plans/${planId}/pdf`);
    if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
    const bytes = await res.arrayBuffer();
    try {
      const cache = await caches.open(PLAN_CACHE);
      await cache.put(cacheKey, new Response(bytes.slice(0), { headers: { "Content-Type": "application/pdf" } }));
    } catch {
      // Cache Storage unavailable (private mode, quota) — viewing still works.
    }
    return { bytes, fromCache: false };
  } catch (err) {
    const cache = await caches.open(PLAN_CACHE);
    const hit = await cache.match(cacheKey);
    if (!hit) throw err;
    return { bytes: await hit.arrayBuffer(), fromCache: true };
  }
}

const PIN_TONE: Record<string, string> = {
  issue: "var(--p-danger)",
  punch: "var(--p-danger)",
  rfi: "var(--p-info)",
  inspection: "var(--p-info)",
  note: "var(--p-text-2)",
  rigging: "var(--p-warning)",
  power: "var(--p-warning)",
  equipment: "var(--p-success)",
  zone: "var(--p-success)",
};

export function PlanViewer({ planId, pins }: { planId: string; pins: PlanPin[] }) {
  const t = useT();
  const hostRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<"loading" | "ready" | "offline-copy" | "error">("loading");

  useEffect(() => {
    let cancelled = false;
    const host = hostRef.current;
    if (!host) return;

    (async () => {
      try {
        const { bytes, fromCache } = await fetchPlanBytes(planId);
        if (cancelled) return;
        const doc = await pdfjs.getDocument({ data: bytes }).promise;
        if (cancelled) return;

        host.replaceChildren();
        const hostWidth = host.clientWidth || 360;

        for (let n = 1; n <= doc.numPages; n++) {
          const page = await doc.getPage(n);
          if (cancelled) return;
          const base = page.getViewport({ scale: 1 });
          // Render at 2x the CSS width for crisp pinch-zoom on plan text.
          const cssScale = hostWidth / base.width;
          const viewport = page.getViewport({ scale: cssScale * 2 });

          const wrap = document.createElement("div");
          wrap.style.position = "relative";
          wrap.style.marginBottom = "8px";

          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          canvas.style.width = "100%";
          canvas.style.height = "auto";
          canvas.style.display = "block";
          canvas.style.borderRadius = "12px";
          canvas.style.border = "1px solid var(--p-border)";
          wrap.appendChild(canvas);

          if (n === 1 && pins.length > 0) {
            for (const pin of pins) {
              const dot = document.createElement("span");
              dot.title = pin.label ?? pin.pin_type;
              dot.style.cssText =
                "position:absolute;width:14px;height:14px;border-radius:50%;border:2px solid var(--p-surface);" +
                `left:${pin.x_pct}%;top:${pin.y_pct}%;transform:translate(-50%,-50%);` +
                `background:${PIN_TONE[pin.pin_type] ?? "var(--p-text-2)"};box-shadow:0 1px 4px rgba(0,0,0,.35);`;
              wrap.appendChild(dot);
            }
          }

          host.appendChild(wrap);
          const ctx = canvas.getContext("2d");
          if (!ctx) continue;
          await page.render({ canvasContext: ctx, viewport }).promise;
        }
        if (!cancelled) setPhase(fromCache ? "offline-copy" : "ready");
      } catch {
        if (!cancelled) setPhase("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [planId, pins]);

  return (
    <div>
      {phase === "loading" && (
        <div className="hint" style={{ padding: "24px 0" }}>
          {t("m.plans.loading", undefined, "Rendering drawing…")}
        </div>
      )}
      {phase === "offline-copy" && (
        <div className="ps-alert ps-alert--warn" role="status" style={{ marginBottom: 10 }}>
          {t("m.plans.offlineCopy", undefined, "Offline. Showing the last copy saved on this device.")}
        </div>
      )}
      {phase === "error" && (
        <div className="ps-alert ps-alert--danger" role="alert" style={{ marginBottom: 10 }}>
          {t(
            "m.plans.error",
            undefined,
            "Couldn't load this drawing. Check your connection; sheets you've opened before stay readable offline.",
          )}
        </div>
      )}
      <div ref={hostRef} />
      {pins.length > 0 && phase !== "error" && (
        <div className="hint" style={{ marginTop: 4, display: "flex", alignItems: "center", gap: 6 }}>
          <KIcon name="MapPin" size={13} />
          {t("m.plans.pinCount", { count: pins.length }, `${pins.length} pins from the console map`)}
        </div>
      )}
    </div>
  );
}
