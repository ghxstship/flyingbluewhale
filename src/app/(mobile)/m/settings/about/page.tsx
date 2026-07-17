import { getRequestT } from "@/lib/i18n/request";
import { KIcon } from "@/components/mobile/kit";
import { BRAND } from "@/lib/brand";
import pkg from "../../../../../../package.json";

/**
 * /m/settings/about — COMPVSS · About · Legal (kit 29, Conformance Spec
 * ratified 2026-07-17; app-store requirement). Version, licenses, and the
 * Privacy Policy + Terms rendered IN-APP — the same i18n keys as the
 * marketing /legal pages, so the two can't drift — and offline-capable
 * (static server render, re-served by the service worker's runtime cache).
 */

const VERSION = (pkg as { version?: string }).version ?? "0.0.0";
const BUILD = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 8) ?? "dev";

export default async function MobileAboutPage() {
  const { t } = await getRequestT();

  const privacy: Array<[string, string]> = [
    [
      t("marketing.legal.privacy.collect.heading", undefined, "What We Collect"),
      t(
        "marketing.legal.privacy.collect.body",
        undefined,
        "Account info, workspace content you upload, and operational telemetry (pageviews, errors, API timing).",
      ),
    ],
    [
      t("marketing.legal.privacy.use.heading", undefined, "How We Use It"),
      t(
        "marketing.legal.privacy.use.body",
        undefined,
        "To run the Service, prevent abuse, and improve reliability. We do not sell customer data.",
      ),
    ],
    [
      t("marketing.legal.privacy.subprocessors.heading", undefined, "Subprocessors"),
      t(
        "marketing.legal.privacy.subprocessors.body",
        undefined,
        "Supabase (hosting + database), Stripe (billing), Anthropic (AI), Vercel (edge + CDN).",
      ),
    ],
    [
      t("marketing.legal.privacy.retention.heading", undefined, "Retention"),
      t(
        "marketing.legal.privacy.retention.body",
        undefined,
        "Default 90 days for audit logs; customer content retained until you delete it or your org is deleted.",
      ),
    ],
  ];

  const terms: Array<[string, string]> = [
    [
      t("marketing.legal.terms.acceptance.heading", undefined, "1. Acceptance of Terms"),
      t(
        "marketing.legal.terms.acceptance.body",
        undefined,
        "By accessing or using the ATLVS Technologies platform you agree to these Terms. If you do not agree, do not use the Service.",
      ),
    ],
    [
      t("marketing.legal.terms.accounts.heading", undefined, "2. Accounts"),
      t(
        "marketing.legal.terms.accounts.body",
        undefined,
        "You are responsible for safeguarding the credentials used to access your account and for any activity under your account.",
      ),
    ],
    [
      t("marketing.legal.terms.billing.heading", undefined, "3. Subscription & Billing"),
      t(
        "marketing.legal.terms.billing.body",
        undefined,
        "Paid plans are billed via Stripe. Taxes, cancellation, and refund policies are documented in your in-app billing settings.",
      ),
    ],
    [
      t("marketing.legal.terms.data.heading", undefined, "4. Data Ownership"),
      t(
        "marketing.legal.terms.data.body",
        undefined,
        "You own the content you upload. We process it solely to provide the Service. Export at any time from Settings → Compliance.",
      ),
    ],
    [
      t("marketing.legal.terms.termination.heading", undefined, "5. Termination"),
      t(
        "marketing.legal.terms.termination.body",
        undefined,
        "Either party may terminate at any time. Your data remains exportable for 30 days post-termination.",
      ),
    ],
  ];

  return (
    <div className="screen screen-anim">
      <a className="backbtn" href="/m/settings">
        <KIcon name="ChevronLeft" size={17} /> {t("m.settings.title", undefined, "Settings")}
      </a>
      <div className="scr-eye">{t("m.about.eyebrow", undefined, "Settings · Legal")}</div>
      <h1 className="scr-h">{t("m.about.title", undefined, "About")}</h1>

      {/* ── Version ── */}
      <div className="item">
        <KIcon name="Compass" size={18} style={{ color: "var(--p-text-2)" }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="t">COMPVSS</div>
          <div className="s">
            {t("m.about.version", { version: VERSION, build: BUILD }, "Version {version} · Build {build}")}
          </div>
        </div>
      </div>
      <div className="item">
        <KIcon name="Building2" size={18} style={{ color: "var(--p-text-2)" }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="t">{BRAND.legalName}</div>
          <div className="s">{t("m.about.company", undefined, "Site & venue operations, by ATLVS Technologies")}</div>
        </div>
      </div>

      {/* ── Licenses ── */}
      <div className="sech">
        <h2>{t("m.about.licenses.heading", undefined, "Licenses")}</h2>
      </div>
      <div className="item" style={{ display: "block" }}>
        <p className="s" style={{ color: "var(--p-text-2)" }}>
          {t(
            "m.about.licenses.body",
            undefined,
            "COMPVSS is built on open-source software (Next.js, React, Supabase and others, under MIT and compatible licenses). Pictograms are the public-domain AIGA / U.S. DOT symbol signs. Type: Hanken Grotesk, Bebas Neue, Anton, Space Mono and IBM Plex Mono under the SIL Open Font License.",
          )}
        </p>
      </div>

      {/* ── Privacy Policy — rendered in-app ── */}
      <div className="sech">
        <h2>{t("marketing.legal.privacy.title", undefined, "Privacy Policy")}</h2>
      </div>
      <div className="item" style={{ display: "block" }}>
        <p className="s" style={{ color: "var(--p-text-3)", marginBottom: 8 }}>
          {t("marketing.legal.privacy.lastUpdated", { date: "2026-04-16" }, "Last updated: {date}")}
        </p>
        {privacy.map(([h, b]) => (
          <div key={h} style={{ padding: "6px 0" }}>
            <div className="t" style={{ fontSize: 13.5 }}>
              {h}
            </div>
            <p className="s" style={{ color: "var(--p-text-2)", marginTop: 2 }}>
              {b}
            </p>
          </div>
        ))}
      </div>

      {/* ── Terms of Service — rendered in-app ── */}
      <div className="sech">
        <h2>{t("marketing.legal.terms.title", undefined, "Terms of Service")}</h2>
      </div>
      <div className="item" style={{ display: "block" }}>
        <p className="s" style={{ color: "var(--p-text-3)", marginBottom: 8 }}>
          {t("marketing.legal.terms.lastUpdated", { date: "2026-04-16" }, "Last updated: {date}")}
        </p>
        {terms.map(([h, b]) => (
          <div key={h} style={{ padding: "6px 0" }}>
            <div className="t" style={{ fontSize: 13.5 }}>
              {h}
            </div>
            <p className="s" style={{ color: "var(--p-text-2)", marginTop: 2 }}>
              {b}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
