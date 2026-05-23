import { formatRelative } from "@/lib/i18n/format";

/** Compact relative time for dense table cells: "5m ago", "3h ago", "2d ago". */
export function timeAgo(date: Date | string | number | null | undefined): string {
  return formatRelative(date, { compact: true });
}

/**
 * Title Case noun count for headers/subtitles. Use this in any non-body UI
 * string that shows "{n} {noun}(s)" — module subtitles, eyebrows, badges,
 * table summaries. Body paragraphs stay sentence case; this helper is the
 * canonical lever for the Title Case convention everywhere else.
 *
 *   countLabel(0, "Task")          → "0 Tasks"
 *   countLabel(1, "Task")          → "1 Task"
 *   countLabel(3, "Atom", "Atoms") → "3 Atoms"
 *   countLabel(2, "Entry", "Entries")
 */
export function countLabel(n: number, singular: string, plural?: string): string {
  const word = n === 1 ? singular : (plural ?? `${singular}s`);
  return `${n} ${word}`;
}

export function slugify(s: string, max = 48) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, max);
}

/**
 * Render enum tokens like `in_review` / `briefed` / `talent_call` as
 * `In Review` / `Briefed` / `Talent Call`. Use anywhere a column, badge,
 * or chip is showing a raw enum value to a user.
 */
export function toTitle(s: string): string {
  return s.replace(/_/g, " ").replace(/\b(\w)/g, (m) => m.toUpperCase());
}

export function dollarsToCents(v: string | number | undefined | null): number {
  if (v == null || v === "") return 0;
  const n = typeof v === "string" ? parseFloat(v) : v;
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

export function generateNumber(prefix: string) {
  const y = new Date().getFullYear().toString().slice(-2);
  const m = Math.floor(Math.random() * 99999)
    .toString()
    .padStart(5, "0");
  return `${prefix}-${y}${m}`;
}
