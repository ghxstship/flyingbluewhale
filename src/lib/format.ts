/**
 * Legacy format helpers — re-exported from src/lib/i18n/format.ts.
 *
 * Use the locale-aware versions directly in new code:
 *   import { formatMoney, formatDate, formatRelative } from "@/lib/i18n/format";
 *
 * This file exists for backwards-compatible imports across the codebase.
 */

import { formatRelative } from "@/lib/i18n/format";

export { formatMoney, formatDate, formatNumber, formatDateTime } from "@/lib/i18n/format";

/** Compact relative time for dense table cells: "5m ago", "3h ago", "2d ago". */
export function timeAgo(date: Date | string | number | null | undefined): string {
  return formatRelative(date, { compact: true });
}

export function slugify(s: string, max = 48) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, max);
}

export function dollarsToCents(v: string | number | undefined | null): number {
  if (v == null || v === "") return 0;
  const n = typeof v === "string" ? parseFloat(v) : v;
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

export function generateNumber(prefix: string) {
  const y = new Date().getFullYear().toString().slice(-2);
  const m = Math.floor(Math.random() * 99999).toString().padStart(5, "0");
  return `${prefix}-${y}${m}`;
}
