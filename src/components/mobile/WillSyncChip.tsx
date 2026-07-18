"use client";

import { CloudUpload } from "lucide-react";
import { useT } from "@/lib/i18n/LocaleProvider";
import { useOutboxPending } from "@/lib/offline/useOutboxPending";

/**
 * Kit 32 B2 — the "Will Sync · N" pending badge for a surface whose writes
 * ride the durable outbox. Renders nothing unless the outbox REALLY holds
 * rows for the given endpoint(s); the count comes straight from IndexedDB,
 * so the chip can never promise a sync that isn't queued.
 */
export function WillSyncChip({
  endpoints,
  align,
}: {
  endpoints: readonly string[];
  /** "center" wraps the chip in a centered block row (with its own margin)
   * so callers don't ship an empty spacer when nothing is pending. */
  align?: "center";
}) {
  const t = useT();
  const pending = useOutboxPending(endpoints);
  if (pending === 0) return null;
  const chip = (
    <span
      role="status"
      className="ps-badge ps-badge--warn"
      style={{ display: "inline-flex", alignItems: "center", gap: 5 }}
    >
      <CloudUpload size={12} aria-hidden="true" />
      {t("m.outbox.willSync", { n: pending }, `Will Sync · ${pending}`)}
    </span>
  );
  if (align === "center") {
    return <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>{chip}</div>;
  }
  return chip;
}
