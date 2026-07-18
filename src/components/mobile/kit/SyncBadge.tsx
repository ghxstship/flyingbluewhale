"use client";

import type { CSSProperties } from "react";
import { KIcon } from "./icon";

/**
 * SyncBadge — the DS sync/offline status PILL (kit 32 DS_ALIGNMENT §2:
 * "Sync stamp / offline banner → use DS `SyncBadge` for the pill; the
 * tap-to-refresh bar stays app-level").
 *
 * Pure presentation: the shell's <SyncBanner> owns the outbox depth +
 * online state and passes a resolved state and an already-translated
 * label — no i18n, no listeners here (kit primitive rule).
 *
 *   offline  — no network; queued writes hold (warning tone)
 *   queued   — writes waiting for reconnect (warning tone)
 *   syncing  — replaying the outbox now (info tone, spinning icon)
 *   stale    — the SW served an offline copy (warning tone)
 */
export type SyncBadgeState = "offline" | "queued" | "syncing" | "stale";

export type SyncBadgeProps = {
  state: SyncBadgeState;
  /** Already-translated pill text. */
  label: string;
  style?: CSSProperties;
};

const STATE_ICON: Record<SyncBadgeState, string> = {
  offline: "CloudOff",
  queued: "CloudUpload",
  syncing: "RefreshCw",
  stale: "History",
};

/** Tone source per state — resolves from --p-* only (DS token rule). */
const STATE_TONE: Record<SyncBadgeState, string> = {
  offline: "var(--p-warning)",
  queued: "var(--p-warning)",
  syncing: "var(--p-info)",
  stale: "var(--p-warning)",
};

const STATE_INK: Record<SyncBadgeState, string> = {
  offline: "var(--p-warning-text, var(--p-text-1))",
  queued: "var(--p-warning-text, var(--p-text-1))",
  syncing: "var(--p-info-text, var(--p-text-1))",
  stale: "var(--p-warning-text, var(--p-text-1))",
};

export function SyncBadge({ state, label, style }: SyncBadgeProps) {
  return (
    <span
      className="rounded-full"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "2px 10px",
        fontSize: 12,
        fontWeight: 600,
        lineHeight: "18px",
        whiteSpace: "nowrap",
        background: `color-mix(in srgb, ${STATE_TONE[state]} 16%, var(--p-surface))`,
        color: STATE_INK[state],
        border: `1px solid color-mix(in srgb, ${STATE_TONE[state]} 35%, transparent)`,
        ...style,
      }}
    >
      <KIcon
        name={STATE_ICON[state]}
        size={12}
        className={state === "syncing" ? "motion-safe:animate-spin" : undefined}
      />
      {label}
    </span>
  );
}
