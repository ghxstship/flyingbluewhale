import "server-only";
import { createServiceClient } from "../supabase/server";
import { ADMIN_BAND_ROLES } from "../auth";
import { log } from "../log";

/**
 * Org-level show-day posture for the push discipline engine.
 *
 * Show-Day Mode is toggled from the /studio Home hero (ShowDayToggle) and
 * persisted PER USER in `user_preferences.ui_state.show_day_mode` — there
 * is no org column. For the SENDER we need an org-level answer, so the
 * derivation is: the org is in show-day mode when ANY active admin-band
 * member (owner/admin — the people who run the console Home where the
 * toggle lives) currently has `show_day_mode` on. One operator flipping
 * the pill flips the org's push posture, which is the intent: show-day is
 * an operational declaration, not a personal preference.
 *
 * Cached in-process for 60s per org so the send path doesn't pay two
 * reads per push during a show-day scan storm. Fail-open to FALSE — a
 * read error must not promote ambient pushes through quiet hours.
 */

const TTL_MS = 60_000;

type CacheEntry = { value: boolean; expires: number };
const cache = new Map<string, CacheEntry>();

/** Test hook — clear the per-org cache. */
export function _clearShowDayCache(): void {
  cache.clear();
}

export async function isOrgShowDay(orgId: string): Promise<boolean> {
  if (!orgId) return false;
  const hit = cache.get(orgId);
  const now = Date.now();
  if (hit && hit.expires > now) return hit.value;
  let value = false;
  try {
    const svc = createServiceClient();
    const { data: members } = await svc
      .from("memberships")
      .select("user_id")
      .eq("org_id", orgId)
      .in("role", [...ADMIN_BAND_ROLES])
      .is("deleted_at", null);
    const userIds = (members ?? []).map((m) => m.user_id as string);
    if (userIds.length > 0) {
      const { data: prefs } = await svc.from("user_preferences").select("ui_state").in("user_id", userIds);
      value = (prefs ?? []).some(
        (p) => Boolean((p.ui_state as { show_day_mode?: boolean } | null)?.show_day_mode),
      );
    }
  } catch (err) {
    log.warn("push.show_day_check_failed", { orgId, err: (err as Error).message });
    value = false;
  }
  cache.set(orgId, { value, expires: now + TTL_MS });
  return value;
}
