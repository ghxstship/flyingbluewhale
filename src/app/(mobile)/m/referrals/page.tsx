import { ChevronLeft, Gift, Send, Share2, Ticket, UserCheck, UserPlus } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { getRequestT } from "@/lib/i18n/request";
import { EmptyState } from "@/components/ui/EmptyState";

export const dynamic = "force-dynamic";

/**
 * /m/referrals — Referrals & Rewards.
 *
 * COMPVSS kit `tab==="referrals"` + REFERRAL (design truth app.jsx 2751-2797,
 * 845-853). There is NO referral/affiliate table in the schema, so this is
 * honest: the hero + "How It Works" render as a static program explainer keyed
 * to the signed-in user's handle, the share/invite CTAs are present, and the
 * referral list shows a tasteful empty state instead of fabricated entries.
 */
export default async function ReferralsPage() {
  const session = await requireSession();
  const { t } = await getRequestT();

  // Derive a stable, real referral code from the user id (no backing table).
  const code = `ATLVS-${session.userId.slice(0, 4).toUpperCase()}`;
  const link = `atlvs.pro/r/${session.userId.slice(0, 8)}`;

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
            <div
              style={{
                fontFamily: "var(--p-heading)",
                fontSize: 30,
                lineHeight: 1,
                marginTop: 3,
              }}
            >
              0 {t("m.referrals.pts", undefined, "pts")}
            </div>
          </div>
          <span className="ps-badge ps-badge--neutral">
            {t("m.referrals.tier", undefined, "Starter")}
          </span>
        </div>
        <div className="rh-bar">
          <span style={{ width: "0%" }} />
        </div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,.7)" }}>
          {t("m.referrals.next", undefined, "Refer crew to start earning rewards.")}
        </div>
      </div>

      <div className="item" style={{ alignItems: "center" }}>
        <span className="more-ic" style={{ color: "var(--p-accent-text)" }}>
          <Ticket size={18} />
        </span>
        <div style={{ flex: 1 }}>
          <div className="t" style={{ fontFamily: "var(--p-mono)", letterSpacing: "0.1em" }}>
            {code}
          </div>
          <div className="s">{link}</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, margin: "2px 0 6px" }}>
        <button type="button" className="ps-btn ps-btn--cta" style={{ flex: 1, justifyContent: "center" }}>
          <Share2 size={16} /> {t("m.referrals.share", undefined, "Share")}
        </button>
        <button type="button" className="ps-btn ps-btn--secondary" style={{ flex: 1, justifyContent: "center" }}>
          <UserPlus size={16} /> {t("m.referrals.invite", undefined, "Invite")}
        </button>
      </div>

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
        <h2>{t("m.referrals.yours", undefined, "Your Referrals")}</h2>
      </div>
      <EmptyState
        size="compact"
        title={t("m.referrals.empty", undefined, "No Referrals Yet")}
        description={t(
          "m.referrals.emptyBody",
          undefined,
          "Share your code — referrals and rewards show up here.",
        )}
      />
    </div>
  );
}
