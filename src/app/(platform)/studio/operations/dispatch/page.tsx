import { redirect } from "next/navigation";

/**
 * Dispatch Matrix → Unified Schedule (CP·3).
 *
 * The read-only hour-grid was promoted into the writable superset at
 * /studio/operations/schedule (crew + fleet + spaces + typed activities on one
 * timeline). This route 301s to the fleet/crew lens of the new surface so the
 * old link + any bookmarks keep resolving. Sitemap-EXEMPT (pure redirect).
 */
export default async function Page({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const { date } = await searchParams;
  const q = new URLSearchParams({ lane: "vehicle,crew" });
  if (date) q.set("day", date);
  redirect(`/studio/operations/schedule?${q.toString()}`);
}
