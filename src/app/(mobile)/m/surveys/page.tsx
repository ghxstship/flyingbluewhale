import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { audiencesForViewer } from "@/lib/db/announcements";

export const dynamic = "force-dynamic";

/**
 * /m/surveys — the respondent side of the studio-authored surveys
 * (`/studio/comms/surveys` authors + tallies; this surface answers).
 *
 * Org-scoped, audience-filtered through the same `audiencesForViewer`
 * mapping the announcements feed uses (the `surveys.audience` column carries
 * the identical enum). Open = published AND (no deadline OR deadline in the
 * future). Closed surveys stay listed only when the caller responded, as a
 * receipt. Anonymous surveys store no respondent id, so a "Responded" state
 * cannot be shown for them (honest limitation, not a bug).
 */

type SurveyRow = {
  id: string;
  title: string;
  description: string | null;
  anonymous: boolean;
  publish_state: string;
  closes_at: string | null;
  created_at: string;
};

export default async function MobileSurveysPage({
  searchParams,
}: {
  searchParams: Promise<{ done?: string }>;
}) {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <div className="screen screen-anim">
        <div className="scr-eye">{t("m.surveys.eyebrow", undefined, "Your Voice")}</div>
        <h1 className="scr-h">{t("m.surveys.title", undefined, "Surveys")}</h1>
        <p className="form-intro">{t("common.configureSupabase", undefined, "Configure Supabase.")}</p>
      </div>
    );
  }

  const { done } = await searchParams;
  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();

  const audiences = audiencesForViewer(session.role ?? null, session.persona ?? null);
  const { data: surveyData } = await supabase
    .from("surveys")
    .select("id, title, description, anonymous, publish_state, closes_at, created_at")
    .eq("org_id", session.orgId)
    .in("publish_state", ["published", "closed"])
    .in("audience", audiences)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(50);
  const surveys = (surveyData ?? []) as SurveyRow[];

  // Which of these has the caller already answered? Only attributable
  // (non-anonymous) responses can match — anonymous rows carry no
  // respondent_id by design.
  const respondedIds = new Set<string>();
  if (surveys.length > 0) {
    const { data: mine } = await supabase
      .from("survey_responses")
      .select("survey_id")
      .eq("respondent_id", session.userId)
      .in(
        "survey_id",
        surveys.map((s) => s.id),
      );
    for (const r of (mine ?? []) as Array<{ survey_id: string }>) respondedIds.add(r.survey_id);
  }

  const now = Date.now();
  const rows = surveys
    .map((s) => {
      const open = s.publish_state === "published" && (!s.closes_at || Date.parse(s.closes_at) > now);
      return { survey: s, open, responded: respondedIds.has(s.id) };
    })
    // Open surveys always show; closed ones only as a receipt of the
    // caller's own response.
    .filter((r) => r.open || r.responded);

  const openCount = rows.filter((r) => r.open && !r.responded).length;

  return (
    <div className="screen screen-anim">
      <div className="scr-eye">
        {t("m.surveys.eyebrow.count", { count: openCount }, `${openCount} Awaiting Your Answer`)}
      </div>
      <h1 className="scr-h" style={{ marginBottom: 12 }}>
        {t("m.surveys.title", undefined, "Surveys")}
      </h1>

      {done === "1" && (
        <div className="ps-alert ps-alert--success" role="status" style={{ marginBottom: 12 }}>
          {t("m.surveys.submitted", undefined, "Thanks, your response is in.")}
        </div>
      )}

      {rows.length === 0 ? (
        <p className="form-intro">
          {t("m.surveys.empty", undefined, "No surveys are open for you right now. Check back later.")}
        </p>
      ) : (
        rows.map(({ survey: s, open, responded }) => {
          const badge = responded ? (
            <span className="ps-badge ps-badge--ok" style={{ flex: "none" }}>
              {t("m.surveys.state.responded", undefined, "Responded")}
            </span>
          ) : open ? (
            <span className="ps-badge ps-badge--info" style={{ flex: "none" }}>
              {t("m.surveys.state.open", undefined, "Open")}
            </span>
          ) : (
            <span className="ps-badge ps-badge--neutral" style={{ flex: "none" }}>
              {t("m.surveys.state.closed", undefined, "Closed")}
            </span>
          );
          const meta = [
            s.anonymous ? t("m.surveys.anonymous", undefined, "Anonymous") : null,
            s.closes_at
              ? t("m.surveys.closes", { when: fmt.dateTime(s.closes_at) }, `Closes ${fmt.dateTime(s.closes_at)}`)
              : null,
          ]
            .filter(Boolean)
            .join(" · ");
          const body = (
            <>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="t">{s.title}</div>
                {(meta || s.description) && <div className="s">{meta || s.description}</div>}
              </div>
              {badge}
            </>
          );
          return open && !responded ? (
            <Link key={s.id} href={`/m/surveys/${s.id}`} className="item tap" style={{ textDecoration: "none" }}>
              {body}
            </Link>
          ) : (
            <div key={s.id} className="item">
              {body}
            </div>
          );
        })
      )}
    </div>
  );
}
