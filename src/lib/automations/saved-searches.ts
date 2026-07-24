import "server-only";
import { createServiceClient, isServiceClientAvailable } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { writeInbox } from "@/lib/inbox";
import { sendNotificationEmailToUsers } from "@/lib/email";
import { log } from "@/lib/log";

/**
 * Saved-search alert evaluator — rides the same worker tick as the advance
 * chase ladder (/api/v1/internal/automations/schedule).
 *
 * `saved_searches` shipped with `alert_email` / `alert_push` flags,
 * `match_count`, and `last_checked_at`, but nothing ever read the table to
 * evaluate them — the flags were a placebo. This closes the loop for the
 * time-based marketplace kinds:
 *
 *   gig         → job_postings   (job_posting_phase = published)
 *   talent_call → open_calls     (open_call_phase   = published)
 *   rfq         → rfqs           (visibility = public, public_slug set)
 *
 * Directory kinds (talent / crew / vendor) are profiles, not a stream of
 * new records — "new since last check" has no natural meaning there, so
 * they are stamped checked but never alerted (honest no-op, not fabricated
 * matches).
 *
 * Matching is deliberately v1: a search's `query.q` (free text) must
 * ilike-match the record title; a search with no `q` matches every new
 * record of its kind. Structured filters in `query` beyond `q` are ignored
 * until the saved-search composer grows them.
 */

type SavedSearchRow = {
  id: string;
  user_id: string;
  org_id: string | null;
  kind: string;
  name: string;
  query: { q?: string } | null;
  alert_email: boolean;
  alert_push: boolean;
  last_checked_at: string | null;
  match_count: number;
};

const STREAM_KINDS: Record<
  string,
  { table: string; phaseColumn: string | null; softDelete: boolean; href: string; noun: string }
> = {
  gig: { table: "job_postings", phaseColumn: "job_posting_phase", softDelete: true, href: "/marketplace/gigs", noun: "gig" },
  talent_call: {
    table: "open_calls",
    phaseColumn: "open_call_phase",
    softDelete: true,
    href: "/marketplace/calls",
    noun: "open call",
  },
  // rfqs has NO deleted_at column — filtering on it 400s the whole query
  // (which the per-search catch then swallows, so rfq alerts silently never
  // fire). Public visibility is the gate instead.
  rfq: { table: "rfqs", phaseColumn: null, softDelete: false, href: "/marketplace/rfqs", noun: "RFQ" },
};

/** How far back the first-ever check reaches. Prevents a fresh search from
 *  alerting on the entire historical record set. */
const FIRST_CHECK_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export type SavedSearchTickResult = {
  checked: number;
  matched: number;
  alerted: number;
  skipped?: true;
};

export async function evaluateSavedSearches(): Promise<SavedSearchTickResult> {
  if (!isServiceClientAvailable()) return { checked: 0, matched: 0, alerted: 0, skipped: true };
  const service = createServiceClient();

  const { data: searches } = await service
    .from("saved_searches")
    .select("id, user_id, org_id, kind, name, query, alert_email, alert_push, last_checked_at, match_count")
    .or("alert_email.eq.true,alert_push.eq.true")
    .limit(500);
  const rows = (searches ?? []) as SavedSearchRow[];
  if (rows.length === 0) return { checked: 0, matched: 0, alerted: 0 };

  const now = new Date();
  const nowIso = now.toISOString();
  let matched = 0;
  let alerted = 0;

  for (const search of rows) {
    try {
      const stream = STREAM_KINDS[search.kind];
      if (!stream) {
        // Directory kind — stamp checked, never alert (see docblock).
        await service.from("saved_searches").update({ last_checked_at: nowIso }).eq("id", search.id);
        continue;
      }

      const since = search.last_checked_at ?? new Date(now.getTime() - FIRST_CHECK_WINDOW_MS).toISOString();
      // Dynamic table name per stream kind — the sanctioned LooseSupabase case.
      let query = (service as unknown as LooseSupabase)
        .from(stream.table)
        .select("id, title, published_at", { count: "exact" })
        .gte("published_at", since)
        .limit(25);
      // soft-delete-exempt: applied conditionally below — rfqs has no
      // deleted_at column and filtering on it errors the whole query.
      if (stream.softDelete) query = query.is("deleted_at", null);
      if (stream.phaseColumn) query = query.eq(stream.phaseColumn, "published");
      else query = query.eq("visibility", "public").not("public_slug", "is", null);
      const q = search.query?.q?.trim();
      if (q) query = query.ilike("title", `%${q}%`);

      const { data: matches, count } = await query;
      const newMatches = count ?? (matches ?? []).length;

      if (newMatches === 0) {
        await service.from("saved_searches").update({ last_checked_at: nowIso }).eq("id", search.id);
        continue;
      }
      matched += 1;

      await service
        .from("saved_searches")
        .update({ last_checked_at: nowIso, match_count: search.match_count + newMatches })
        .eq("id", search.id);

      const first = ((matches ?? []) as Array<{ title: string | null }>)[0]?.title;
      const title = `New ${stream.noun} matches: ${search.name}`;
      const body =
        newMatches === 1
          ? `1 new ${stream.noun}${first ? `: ${first}` : ""}`
          : `${newMatches} new ${stream.noun}s${first ? `, including ${first}` : ""}`;

      // Bell + (flag-gated) push. sourceId = the search itself, so repeated
      // ticks collapse into one living inbox row per search instead of a
      // pile; reNotify re-surfaces it as unread because this branch only
      // runs when there ARE new matches since the last check.
      await writeInbox({
        userId: search.user_id,
        orgId: search.org_id,
        kind: "marketplace",
        sourceType: "saved_searches",
        sourceId: search.id,
        title,
        body,
        href: stream.href,
        push: search.alert_push,
        reNotify: true,
      });
      if (search.alert_email) {
        await sendNotificationEmailToUsers({
          userIds: [search.user_id],
          title,
          body,
          url: stream.href,
          eyebrow: "Marketplace",
        });
      }
      alerted += 1;
    } catch (err) {
      log.warn("saved_searches.evaluate_failed", { searchId: search.id, err: (err as Error).message });
    }
  }

  return { checked: rows.length, matched, alerted };
}
