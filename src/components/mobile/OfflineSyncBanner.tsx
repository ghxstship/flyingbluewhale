"use client";

import { CloudOff, RefreshCw } from "lucide-react";

/**
 * Offline / sync banner (kit 21 W8) — the field-shell status line for the
 * offline queue. Renders nothing when online with an empty outbox; shows an
 * offline notice with the queued count, or a syncing spinner while the queue
 * drains on reconnect. Colors are tokens-only.
 */
export function OfflineSyncBanner({
  online,
  pending,
  syncing,
  labels,
}: {
  online: boolean;
  pending: number;
  syncing: boolean;
  labels: { offline: string; queued: string; syncing: string };
}) {
  if (online && pending === 0 && !syncing) return null;

  if (syncing) {
    return (
      <div
        role="status"
        className="mb-2 flex items-center gap-2 rounded-[var(--p-r-md)] border border-[var(--p-border)] bg-[var(--p-surface)] px-3 py-2 text-xs text-[var(--p-text-2)]"
      >
        <RefreshCw size={14} className="motion-safe:animate-spin" aria-hidden="true" />
        {labels.syncing}
      </div>
    );
  }

  return (
    <div
      role="status"
      className="mb-2 flex items-center gap-2 rounded-[var(--p-r-md)] border border-[color:var(--p-warning)]/40 bg-[color:var(--p-warning)]/10 px-3 py-2 text-xs text-[var(--p-warning-text)]"
    >
      <CloudOff size={14} aria-hidden="true" />
      <span>{online ? labels.queued.replace("{n}", String(pending)) : labels.offline}</span>
      {!online && pending > 0 ? (
        <span className="ms-auto font-mono">{labels.queued.replace("{n}", String(pending))}</span>
      ) : null}
    </div>
  );
}
