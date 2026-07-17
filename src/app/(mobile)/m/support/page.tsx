import Link from "next/link";
import { getRequestT } from "@/lib/i18n/request";
import { KIcon } from "@/components/mobile/kit";
import { BRAND } from "@/lib/brand";

/**
 * /m/support — COMPVSS · Help & Support (kit 29, Conformance Spec ratified
 * 2026-07-17; app-store requirement for a standalone app). FAQs, contact
 * channels, and report-a-problem — safety issues route to the Incident
 * intake, everything else to the support inbox. Static content, so the
 * screen re-serves offline from the service worker's runtime cache.
 */

export default async function MobileSupportPage() {
  const { t } = await getRequestT();

  const faqs: Array<[string, string]> = [
    [
      t("m.support.faq.clock.q", undefined, "My clock-in isn't registering."),
      t(
        "m.support.faq.clock.a",
        undefined,
        "Time Clock needs location access inside the venue's clock zone. Check your device's location permission, then punch again from Time Clock. Offline punches sync when you're back on network.",
      ),
    ],
    [
      t("m.support.faq.offline.q", undefined, "What works offline?"),
      t(
        "m.support.faq.offline.a",
        undefined,
        "Screens you've visited re-serve offline with a stale banner, and punches, scans and form drafts queue until you reconnect. The Rose and your credentials stay available.",
      ),
    ],
    [
      t("m.support.faq.rose.q", undefined, "My Rose or credential won't scan."),
      t(
        "m.support.faq.rose.a",
        undefined,
        "Raise your screen brightness and try again. If the gate still rejects it, the scan journal shows the reason (expired, wrong zone, duplicate) — ask the gate lead, or reach the team below.",
      ),
    ],
    [
      t("m.support.faq.notifications.q", undefined, "I'm getting too many (or no) notifications."),
      t(
        "m.support.faq.notifications.a",
        undefined,
        "Every notification kind has its own toggle in Settings · Notification Preferences. Push needs the one-time browser permission — re-enable it from Settings if you dismissed it.",
      ),
    ],
    [
      t("m.support.faq.account.q", undefined, "How do I export my data or delete my account?"),
      t(
        "m.support.faq.account.a",
        undefined,
        "Settings · Account has both: a one-tap export of everything we hold about you, and account deletion with a 30-day grace window.",
      ),
    ],
  ];

  return (
    <div className="screen screen-anim">
      <a className="backbtn" href="/m/more">
        <KIcon name="ChevronLeft" size={17} /> {t("m.more.title", undefined, "More")}
      </a>
      <div className="scr-eye">{t("m.support.eyebrow", undefined, "Help Center")}</div>
      <h1 className="scr-h">{t("m.support.title", undefined, "Help & Support")}</h1>
      <p className="form-intro">
        {t("m.support.intro", undefined, "Answers to the common questions, and every way to reach a human.")}
      </p>

      {/* ── Report a problem ── */}
      <div className="sech">
        <h2>{t("m.support.report.heading", undefined, "Report A Problem")}</h2>
      </div>
      <a className="item tap" href="/m/incident/new" style={{ cursor: "pointer" }}>
        <KIcon name="TriangleAlert" size={18} style={{ color: "var(--p-danger)" }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="t">{t("m.support.report.safety", undefined, "Safety Issue")}</div>
          <div className="s">
            {t("m.support.report.safetyDesc", undefined, "Injuries, hazards, security — files an incident report")}
          </div>
        </div>
        <KIcon name="ChevronRight" size={16} style={{ color: "var(--p-text-3)" }} />
      </a>
      <a
        className="item tap"
        href={`mailto:${BRAND.emails.support}?subject=COMPVSS%20app%20problem`}
        style={{ cursor: "pointer" }}
      >
        <KIcon name="Bug" size={18} style={{ color: "var(--p-text-2)" }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="t">{t("m.support.report.app", undefined, "App Problem")}</div>
          <div className="s">
            {t("m.support.report.appDesc", undefined, "Something broken or confusing — tell the product team")}
          </div>
        </div>
        <KIcon name="ChevronRight" size={16} style={{ color: "var(--p-text-3)" }} />
      </a>

      {/* ── Contact channels ── */}
      <div className="sech">
        <h2>{t("m.support.contact.heading", undefined, "Contact")}</h2>
      </div>
      <a className="item tap" href={`mailto:${BRAND.emails.support}`} style={{ cursor: "pointer" }}>
        <KIcon name="Mail" size={18} style={{ color: "var(--p-text-2)" }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="t">{t("m.support.contact.email", undefined, "Email Support")}</div>
          <div className="s">{BRAND.emails.support}</div>
        </div>
        <KIcon name="ChevronRight" size={16} style={{ color: "var(--p-text-3)" }} />
      </a>
      <Link className="item tap" href="/m/inbox" style={{ cursor: "pointer" }}>
        <KIcon name="MessageSquare" size={18} style={{ color: "var(--p-text-2)" }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="t">{t("m.support.contact.inbox", undefined, "Message Your Team")}</div>
          <div className="s">
            {t("m.support.contact.inboxDesc", undefined, "Ops questions go fastest through your project inbox")}
          </div>
        </div>
        <KIcon name="ChevronRight" size={16} style={{ color: "var(--p-text-3)" }} />
      </Link>
      <a className="item tap" href="/m/emergency" style={{ cursor: "pointer" }}>
        <KIcon name="Siren" size={18} style={{ color: "var(--p-danger)" }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="t">{t("m.support.contact.emergency", undefined, "Emergency")}</div>
          <div className="s">
            {t("m.support.contact.emergencyDesc", undefined, "On-site emergency contacts and procedures")}
          </div>
        </div>
        <KIcon name="ChevronRight" size={16} style={{ color: "var(--p-text-3)" }} />
      </a>

      {/* ── FAQs ── */}
      <div className="sech">
        <h2>{t("m.support.faq.heading", undefined, "Frequently Asked")}</h2>
      </div>
      {faqs.map(([q, a]) => (
        <details key={q} className="item" style={{ display: "block" }}>
          <summary className="t" style={{ cursor: "pointer", listStyle: "none" }}>
            {q}
          </summary>
          <p className="s" style={{ marginTop: 6, color: "var(--p-text-2)" }}>
            {a}
          </p>
        </details>
      ))}

      {/* ── Guides ── */}
      <div className="sech">
        <h2>{t("m.support.more.heading", undefined, "More Help")}</h2>
      </div>
      <a className="item tap" href="/m/guide" style={{ cursor: "pointer" }}>
        <KIcon name="BookOpen" size={18} style={{ color: "var(--p-text-2)" }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="t">{t("m.support.more.guide", undefined, "Event Guide")}</div>
          <div className="s">{t("m.support.more.guideDesc", undefined, "Know-before-you-go for your event")}</div>
        </div>
        <KIcon name="ChevronRight" size={16} style={{ color: "var(--p-text-3)" }} />
      </a>
      <Link className="item tap" href="/m/docs" style={{ cursor: "pointer" }}>
        <KIcon name="Library" size={18} style={{ color: "var(--p-text-2)" }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="t">{t("m.support.more.knowledge", undefined, "Knowledge")}</div>
          <div className="s">{t("m.support.more.knowledgeDesc", undefined, "SOPs, policies and how-tos")}</div>
        </div>
        <KIcon name="ChevronRight" size={16} style={{ color: "var(--p-text-3)" }} />
      </Link>
    </div>
  );
}
