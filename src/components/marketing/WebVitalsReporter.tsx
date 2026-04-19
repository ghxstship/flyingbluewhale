"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

/**
 * M3-08 — Web Vitals → Sentry.
 *
 * Subscribes to the Next.js Web Vitals stream and reports each metric
 * to Sentry as a `measurement` on the active transaction. Because
 * `next/web-vitals` relies on a `useReportWebVitals` hook available in
 * the app router, we use the exported init API.
 *
 * This is deliberately a thin client wrapper — mounting it anywhere in
 * the tree subscribes once per page load. We mount it in the marketing
 * layout so only marketing pages report, keeping the marketing signal
 * separate from product-app error noise. Sentry scrubs PII via the
 * beforeSend pipeline that's already configured.
 */
export function WebVitalsReporter() {
  useEffect(() => {
    // Dynamic import — `web-vitals` is tiny but lazy-load anyway so it
    // doesn't block first paint even on this already-client component.
    let cancelled = false;
    import("web-vitals").then((mod) => {
      if (cancelled) return;
      const report = (name: string, value: number, id: string, rating?: string) => {
        // Send as a measurement AND a breadcrumb — both are queryable in
        // Sentry. Measurement is the source-of-truth for the metric; the
        // breadcrumb gives operators human-readable context on any
        // associated error event.
        Sentry.setMeasurement(name, value, name === "CLS" ? "none" : "millisecond");
        Sentry.addBreadcrumb({
          category: "web-vitals",
          level: "info",
          data: { metric: name, value, id, rating: rating ?? "unknown" },
        });
      };
      // Each `onX` callback fires once per page with the final value.
      // CLS / INP can fire multiple times; we always report the latest.
      mod.onCLS((m) => report("CLS", m.value, m.id, m.rating));
      mod.onLCP((m) => report("LCP", m.value, m.id, m.rating));
      mod.onINP((m) => report("INP", m.value, m.id, m.rating));
      mod.onFCP((m) => report("FCP", m.value, m.id, m.rating));
      mod.onTTFB((m) => report("TTFB", m.value, m.id, m.rating));
    }).catch(() => {
      /* web-vitals unavailable — silent fail */
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return null;
}
