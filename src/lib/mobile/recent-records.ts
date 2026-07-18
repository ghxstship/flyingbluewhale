"use client";

/**
 * Recently-viewed records store — kit 32 C3. A small, per-device localStorage
 * ring of the last records the user opened, surfaced as a rail on /m/more.
 *
 * Client-only (localStorage). Not per-user across devices by design: this is a
 * convenience "jump back to what I was looking at" rail, not an audit surface.
 * Record-detail surfaces push a visit; the rail reads the last five. A
 * same-tab custom event keeps an open rail live when a visit lands.
 */

export type RecentRecord = {
  /** In-app href, e.g. "/m/tasks/abc". Dedupe key. */
  href: string;
  title: string;
  /** KIcon name for the row glyph. */
  kind: string;
  /** epoch ms of the visit. */
  at: number;
};

const KEY = "compvss.recent-records";
const MAX = 5;
const EVT = "compvss:recent-records";

function safeRead(): RecentRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (r): r is RecentRecord =>
        !!r &&
        typeof r === "object" &&
        typeof (r as RecentRecord).href === "string" &&
        typeof (r as RecentRecord).title === "string",
    );
  } catch {
    return [];
  }
}

export function readRecentRecords(): RecentRecord[] {
  return safeRead().slice(0, MAX);
}

export function pushRecentRecord(rec: Omit<RecentRecord, "at">): void {
  if (typeof window === "undefined") return;
  if (!rec.href || !rec.title) return;
  try {
    const now = Date.now();
    const next = [{ ...rec, at: now }, ...safeRead().filter((r) => r.href !== rec.href)].slice(0, MAX);
    window.localStorage.setItem(KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent(EVT));
  } catch {
    /* private-mode / quota — the rail just stays empty. */
  }
}

export const RECENT_RECORDS_EVENT = EVT;
