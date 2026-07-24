import { requireSession } from "@/lib/auth";
import { createClient, createServiceClient, isServiceClientAvailable } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { audiencesForViewer } from "@/lib/db/announcements";
import { PollsList, type PollView } from "./PollsList";

export const dynamic = "force-dynamic";

/**
 * /m/polls — the respondent side of the studio-authored polls
 * (`/studio/comms/polls` authors + tallies; this surface votes).
 *
 * Org-scoped, audience-filtered through the same `audiencesForViewer`
 * mapping the announcements feed uses. Live polls the caller has not voted
 * on show inline option buttons; once voted (or once the poll closes) the
 * same card shows the result bars with the caller's own pick marked.
 *
 * A poll whose closes_at has passed is treated as closed for voting even if
 * its publish_state is still "live" — flipping the state at the deadline is
 * a separate close automation.
 */

type PollRow = {
  id: string;
  question: string;
  publish_state: string;
  closes_at: string | null;
  created_at: string;
};

type OptionRow = { id: string; poll_id: string; ordinal: number; label: string };
type VoteRow = { poll_id: string; option_id: string };

export default async function MobilePollsPage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <div className="screen screen-anim">
        <div className="scr-eye">{t("m.polls.eyebrow", undefined, "Quick Questions")}</div>
        <h1 className="scr-h">{t("m.polls.title", undefined, "Polls")}</h1>
        <p className="form-intro">{t("common.configureSupabase", undefined, "Configure Supabase.")}</p>
      </div>
    );
  }

  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();

  const audiences = audiencesForViewer(session.role ?? null, session.persona ?? null);
  const { data: pollData } = await supabase
    .from("polls")
    .select("id, question, publish_state, closes_at, created_at")
    .eq("org_id", session.orgId)
    .in("publish_state", ["live", "closed"])
    .in("audience", audiences)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(50);
  const polls = (pollData ?? []) as PollRow[];
  const pollIds = polls.map((p) => p.id);

  let options: OptionRow[] = [];
  let myVotes: VoteRow[] = [];
  let allVotes: VoteRow[] = [];
  if (pollIds.length > 0) {
    const [{ data: optData }, { data: mineData }] = await Promise.all([
      supabase.from("poll_options").select("id, poll_id, ordinal, label").in("poll_id", pollIds).order("ordinal"),
      supabase.from("poll_votes").select("poll_id, option_id").eq("voter_id", session.userId).in("poll_id", pollIds),
    ]);
    options = (optData ?? []) as OptionRow[];
    myVotes = (mineData ?? []) as VoteRow[];

    // Tally read: the poll_votes RLS policy is voter-self only (a member can
    // read just their own row), so aggregate counts come through the service
    // client — safe here because the org-pinned polls read above already
    // proved the caller's membership, and only counts leave this function
    // (never voter ids). Without the service key (some local setups) the
    // bars honestly degrade to the caller's own vote.
    if (isServiceClientAvailable()) {
      const service = createServiceClient();
      const { data: voteData } = await service.from("poll_votes").select("poll_id, option_id").in("poll_id", pollIds);
      allVotes = (voteData ?? []) as VoteRow[];
    } else {
      allVotes = myVotes;
    }
  }

  const myVoteByPoll = new Map<string, string>();
  for (const v of myVotes) myVoteByPoll.set(v.poll_id, v.option_id);
  const countByOption = new Map<string, number>();
  const totalByPoll = new Map<string, number>();
  for (const v of allVotes) {
    countByOption.set(v.option_id, (countByOption.get(v.option_id) ?? 0) + 1);
    totalByPoll.set(v.poll_id, (totalByPoll.get(v.poll_id) ?? 0) + 1);
  }
  const optionsByPoll = new Map<string, OptionRow[]>();
  for (const o of options) {
    const list = optionsByPoll.get(o.poll_id) ?? [];
    list.push(o);
    optionsByPoll.set(o.poll_id, list);
  }

  const now = Date.now();
  const views: PollView[] = polls
    .map((p): PollView => {
      const closed = p.publish_state === "closed" || (p.closes_at != null && Date.parse(p.closes_at) <= now);
      const myOptionId = myVoteByPoll.get(p.id) ?? null;
      const total = totalByPoll.get(p.id) ?? 0;
      return {
        id: p.id,
        question: p.question,
        closed,
        myOptionId,
        total,
        closesLabel:
          !closed && p.closes_at
            ? t("m.polls.closes", { when: fmt.dateTime(p.closes_at) }, `Closes ${fmt.dateTime(p.closes_at)}`)
            : null,
        options: (optionsByPoll.get(p.id) ?? []).map((o) => {
          const count = countByOption.get(o.id) ?? 0;
          return {
            id: o.id,
            label: o.label,
            count,
            pct: total > 0 ? Math.round((count / total) * 100) : 0,
          };
        }),
      };
    })
    // Closed polls with zero visible votes and no participation from the
    // caller still show — results are the point of a closed poll.
    .filter((p) => p.options.length > 0);

  const openCount = views.filter((p) => !p.closed && !p.myOptionId).length;

  return (
    <div className="screen screen-anim">
      <div className="scr-eye">{t("m.polls.eyebrow.count", { count: openCount }, `${openCount} Awaiting Your Vote`)}</div>
      <h1 className="scr-h" style={{ marginBottom: 12 }}>
        {t("m.polls.title", undefined, "Polls")}
      </h1>
      {views.length === 0 ? (
        <p className="form-intro">
          {t("m.polls.empty", undefined, "No polls are running for you right now. Check back later.")}
        </p>
      ) : (
        <PollsList polls={views} />
      )}
    </div>
  );
}
