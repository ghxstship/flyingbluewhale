/**
 * The daily-log sections a foreman signs off (kit 21 remediation R3, ADR-0015).
 *
 * Lives outside `actions.ts` because that file is a "use server" module, which
 * may only export async functions — a plain const would fail the production
 * build (`A "use server" file can only export async functions`). Both the
 * server action and the page import the tuple from here.
 */
export const DAILY_LOG_SECTIONS = ["manpower", "deliveries", "equipment", "visitors", "photos", "narrative"] as const;
