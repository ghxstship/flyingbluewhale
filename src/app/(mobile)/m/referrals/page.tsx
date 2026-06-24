import { ChevronLeft, Gift, Send, Ticket, UserCheck } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getRequestT } from "@/lib/i18n/request";
import { urlFor } from "@/lib/urls";
import { EmptyState } from "@/components/ui/EmptyState";
import { getOrCreateReferral } from "./actions";
import { ReferralInvite } from "./ReferralInvite";

export const dynamic = "force-dynamic";

// Tier progression thresholds (points → next tier ceiling) for the hero bar.
const TIER_CEILING: Record<string, number> = { bronze: 100, silver: 500, gold: 1500, platinum: 1500 };
const INVITE_STATE_TONE: Record<string, string> = {
  invited: "ps-badge--neutral",
  joined: "ps-badge--info",
  hired: "ps-badge--ok",
};
const INVITE_STATE_LABEL: Record<string, string> = {
  invited: "Invited",
  joined: "Joined",
  hired: "Hired",
};

/**
 * /m/referrals — Referrals & Rewards. Backed by the real `referral_codes`
 * (one row per user, get-or-created on load) + `referral_invitations` tables.
 * The hero shows the user's code/points/tier; the list renders real
 * invitations; "Invite" posts through `sendReferralInvite` (owner column set
 * to the session user so RLS WITH CHECK passes).
 */
export default async function ReferralsPage() {
  const session = await requireSession();
  const supabase = await createClient();
  const { t } = await getRequestT();

  const ref = await getOrCreateReferral();
  // The apex signup surface is the canonical join target; the referral code
  // rides as a `?ref=` query param. There is no `/r/[code]` redemption route,
  // and the link MUST resolve, so it points at the real `/signup` page.
  const link = urlFor("auth", `/signup?ref=${ref.code.toLowerCase()}`);

  const { data: invites } = await supabase
    .from("referral_invitations")
    .select("id, invitee_contact, invite_state, reward_points, created_at")
    .eq("referrer_user_id", session.userId)
    .order("created_at", { ascending: false })
    .limit(50);

  const invitations = invites ?? [];
  const ceiling = TIER_CEILING[ref.tier] ?? 100;
  const pct = Math.max(0, Math.min(100, Math.round((ref.points / ceiling) * 100)));

  const steps: Array<[string, string, React.ReactNode]> = [
    [
      t("m.referrals.step1", undefined, "Share"),
      t("m.referrals.step1s", undefined, "Send your code or link"),
      <Send key="s" size={15} />,
    ],
    [
      t("m.referrals.step2", undefined, "They Join"),
      t("m.referrals.step2s", undefined, "Sign up to the ATLVS network"),
      <UserCheck key="u" size={15} />,
    ],
    [
      t("m.referrals.step3", undefined, "You Earn"),
      t("m.referrals.step3s", undefined, "Points + cash when they're hired"),
      <Gift key="g" size={15} />,
    ],
  ];

  return (
    <div className="screen screen-anim">
      <a className="backbtn" href="/m/more">
        <ChevronLeft size={17} /> {t("m.more.title", undefined, "More")}
      </a>
      <div className="scr-eye">{t("m.referrals.eyebrow", undefined, "ATLVS Ecosystem")}</div>
      <h1 className="scr-h" style={{ marginBottom: 12 }}>
        {t("m.referrals.title", undefined, "Referrals & Rewards")}
      </h1>

      <div className="refer-hero">
        <div className="rh-top">
          <div>
            <div className="es-k" style={{ color: "rgba(255,255,255,.6)" }}>
              {t("m.referrals.balance", undefined, "Reward Balance")}
            </div>
            <div style={{ fontFamily: "var(--p-heading)", fontSize: 30, lineHeight: 1, marginTop: 3 }}>
              {ref.points} {t("m.referrals.pts", undefined, "pts")}
            </div>
          </div>
          <span className="ps-badge ps-badge--neutral" style={{ textTransform: "capitalize" }}>
            {ref.tier}
          </span>
        </div>
        <div className="rh-bar">
          <span style={{ width: `${pct}%` }} />
        </div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,.7)" }}>
          {ref.points > 0
            ? t(
                "m.referrals.toNext",
                { left: Math.max(0, ceiling - ref.points) },
                `${Math.max(0, ceiling - ref.points)} pts to next tier`,
              )
            : t("m.referrals.next", undefined, "Refer crew to start earning rewards.")}
        </div>
      </div>

      <div className="item" style={{ alignItems: "center" }}>
        <span className="more-ic" style={{ color: "var(--p-accent-text)" }}>
          <Ticket size={18} />
        </span>
        <div style={{ flex: 1 }}>
          <div className="t" style={{ fontFamily: "var(--p-mono)", letterSpacing: "0.1em" }}>
            {ref.code}
          </div>
          <div className="s">{link}</div>
        </div>
      </div>

      <ReferralInvite shareLabel={t("m.referrals.share", undefined, "Share")} />

      <div className="sech">
        <h2>{t("m.referrals.how", undefined, "How It Works")}</h2>
      </div>
      <div className="emerg-list">
        {steps.map(([title, sub, icon], i) => (
          <div className="emerg-row" key={i} style={{ gap: 12, cursor: "default" }}>
            <span className="more-ic" style={{ width: 30, height: 30, color: "var(--p-accent-text)" }}>
              {icon}
            </span>
            <span style={{ flex: 1, textAlign: "left" }}>
              <span style={{ display: "block", fontWeight: 700, fontSize: 13 }}>
                {i + 1}. {title}
              </span>
              <span className="s">{sub}</span>
            </span>
          </div>
        ))}
      </div>

      <div className="sech">
        <h2>
          {t("m.referrals.yours", undefined, "Your Referrals")}
          {invitations.length > 0 ? ` · ${invitations.length}` : ""}
        </h2>
      </div>
      {invitations.length === 0 ? (
        <EmptyState
          size="compact"
          title={t("m.referrals.empty", undefined, "No Referrals Yet")}
          description={t(
            "m.referrals.emptyBody",
            undefined,
            "Share your code — referrals and rewards show up here.",
          )}
        />
      ) : (
        invitations.map((inv) => (
          <div className="item" key={inv.id} style={{ alignItems: "center" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="t">{inv.invitee_contact}</div>
              {inv.reward_points > 0 && (
                <div className="s">
                  +{inv.reward_points} {t("m.referrals.pts", undefined, "pts")}
                </div>
              )}
            </div>
            <span className={`ps-badge ${INVITE_STATE_TONE[inv.invite_state] ?? "ps-badge--neutral"}`}>
              {t(
                `m.referrals.state.${inv.invite_state}`,
                undefined,
                INVITE_STATE_LABEL[inv.invite_state] ?? inv.invite_state,
              )}
            </span>
          </div>
        ))
      )}
    </div>
  );
}
