"use client";

import { useEffect, useState } from "react";
import { Sparkles, Camera, XCircle } from "lucide-react";

/**
 * OnsiteARLauncher — the AR-view entry (design_handoff §3 north-star). Full
 * spatial AR (stage labels · friend pins · wayfinding overlaid on camera) is the
 * stated north-star and ships behind `NEXT_PUBLIC_ONSITE_AR`; this entry does
 * the real capability gate today — feature-detecting WebXR `immersive-ar` —
 * rather than a static placeholder, so the screen reflects the device honestly.
 *
 * Token-only colors.
 */
type Support = "checking" | "ready" | "unsupported";

export function OnsiteARLauncher() {
  const [support, setSupport] = useState<Support>("checking");

  useEffect(() => {
    let active = true;
    const xr = (navigator as unknown as { xr?: { isSessionSupported?: (mode: string) => Promise<boolean> } }).xr;
    if (!xr?.isSessionSupported) {
      setSupport("unsupported");
      return;
    }
    xr
      .isSessionSupported("immersive-ar")
      .then((ok) => active && setSupport(ok ? "ready" : "unsupported"))
      .catch(() => active && setSupport("unsupported"));
    return () => {
      active = false;
    };
  }, []);

  if (support === "checking") {
    return <div className="surface rounded-[var(--p-r-md)] p-4 text-sm text-[var(--p-text-3)]">Checking AR support…</div>;
  }

  if (support === "unsupported") {
    return (
      <div className="surface flex items-center gap-2 rounded-[var(--p-r-md)] p-4 text-sm text-[var(--p-text-2)]">
        <XCircle size={16} className="shrink-0 text-[var(--p-text-3)]" aria-hidden="true" />
        AR isn’t available on this device. The live schedule, map, and wayfinding above have you covered.
      </div>
    );
  }

  return (
    <div className="surface flex flex-wrap items-center justify-between gap-3 rounded-[var(--p-r-md)] p-4">
      <p className="flex items-center gap-2 text-sm text-[var(--p-text-1)]">
        <Sparkles size={16} className="text-[var(--p-accent)]" aria-hidden="true" />
        Your device supports AR. Stage labels and friend pins overlaid on your camera are rolling out.
      </p>
      <button type="button" className="ps-btn ps-btn--ghost ps-btn--sm" disabled aria-disabled="true">
        <Camera size={14} aria-hidden="true" />
        Coming soon
      </button>
    </div>
  );
}
