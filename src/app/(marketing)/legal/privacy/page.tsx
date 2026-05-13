import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How FLYTEHAUS Technologies collects, uses, and protects your personal data.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Privacy Policy</h1>
      <p className="mt-4 text-xs text-[var(--text-muted)]">Last updated: 2026-04-16 · Effective: 2026-04-16</p>

      <div className="mt-8 space-y-8 text-sm text-[var(--text-secondary)]">
        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">1. Controller</h2>
          <p className="mt-2">
            FLYTEHAUS Technologies ("we", "us", "our") is the data controller for personal data you provide when
            accessing or using ATLVS, GVTEWAY, or COMPVSS (collectively, the "Service"). Contact:{" "}
            <a href="mailto:privacy@flytehaus.studio" className="underline underline-offset-2">
              privacy@flytehaus.studio
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">2. What We Collect</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              <strong>Account data</strong> — name, email address, profile photo, organisation name, and credentials you
              create.
            </li>
            <li>
              <strong>Workspace content</strong> — projects, tickets, deliverables, proposals, invoices, schedules, and
              other files or records you upload or generate.
            </li>
            <li>
              <strong>Usage data</strong> — pageviews, feature interactions, API timing, and error telemetry (via
              Sentry).
            </li>
            <li>
              <strong>Device & log data</strong> — IP address, browser type, operating system, and request logs retained
              for security and abuse prevention.
            </li>
            <li>
              <strong>Payment data</strong> — billing name, card-last-four, and transaction IDs. Full card numbers are
              processed exclusively by Stripe and never stored by us.
            </li>
            <li>
              <strong>Location data</strong> — GPS coordinates collected only when you explicitly use clock-in / gate
              scanning features on COMPVSS and only for the duration of that session.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">3. Legal Basis (GDPR Art. 6)</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              <strong>Contract performance</strong> — processing your account, workspace content, and billing data to
              deliver the Service.
            </li>
            <li>
              <strong>Legitimate interests</strong> — security monitoring, fraud prevention, product improvement via
              aggregated analytics, and enforcing our Terms.
            </li>
            <li>
              <strong>Consent</strong> — analytics cookies and non-essential error reporting (revocable at any time from
              Settings → Privacy).
            </li>
            <li>
              <strong>Legal obligation</strong> — retaining financial records and responding to lawful requests from
              public authorities.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">4. How We Use It</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Providing, maintaining, and improving the Service.</li>
            <li>Authenticating users and enforcing role-based access controls.</li>
            <li>Sending transactional emails (password resets, invite links, invoice receipts).</li>
            <li>Detecting and preventing fraud, abuse, and security threats.</li>
            <li>Generating aggregate, de-identified analytics to improve product reliability.</li>
            <li>Complying with applicable laws and responding to lawful legal process.</li>
          </ul>
          <p className="mt-2">We do not sell, rent, or trade your personal data to third parties.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">5. Subprocessors</h2>
          <p className="mt-2">
            We use the following subprocessors to deliver the Service. Each is bound by a data processing agreement and
            subject to equivalent technical and organisational safeguards.
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              <strong>Supabase Inc.</strong> — database hosting and authentication (USA / EU region available).
            </li>
            <li>
              <strong>Vercel Inc.</strong> — edge hosting and CDN (global).
            </li>
            <li>
              <strong>Stripe Inc.</strong> — payment processing (USA / EU).
            </li>
            <li>
              <strong>Anthropic PBC</strong> — AI assistant inference (USA). Data sent is limited to the
              user-submitted prompt and session context; we do not send PII beyond what the user explicitly includes.
            </li>
            <li>
              <strong>Sentry (Functional Software, Inc.)</strong> — error monitoring (USA / EU region available).
              Events are scrubbed of PII before transmission.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">6. International Transfers</h2>
          <p className="mt-2">
            Where we transfer personal data outside the European Economic Area (EEA) or the United Kingdom, we rely on
            the EU Standard Contractual Clauses (SCCs) and, where applicable, the UK International Data Transfer
            Addendum (IDTA), or on an adequacy decision by the European Commission. A copy of the applicable transfer
            mechanism is available on request at{" "}
            <a href="mailto:privacy@flytehaus.studio" className="underline underline-offset-2">
              privacy@flytehaus.studio
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">7. Retention</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Audit logs: 90 days rolling, then deleted.</li>
            <li>Workspace content: retained until you delete it or your organisation is deleted.</li>
            <li>Backup copies: purged within 30 days of deletion.</li>
            <li>Financial records: 7 years where required by applicable law.</li>
            <li>Anonymised analytics: indefinitely (no personal data).</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">8. Your Rights</h2>
          <p className="mt-2">
            Subject to applicable law, you have the following rights regarding your personal data:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              <strong>Access</strong> — obtain a copy of all personal data we hold about you (Settings → Compliance →
              Export Data, or email us).
            </li>
            <li>
              <strong>Rectification</strong> — correct inaccurate data from your profile settings.
            </li>
            <li>
              <strong>Erasure</strong> — request deletion of your account and associated data (Settings → Account →
              Delete Account).
            </li>
            <li>
              <strong>Restriction</strong> — ask us to pause processing while a dispute is resolved.
            </li>
            <li>
              <strong>Data portability</strong> — receive your data in a machine-readable format.
            </li>
            <li>
              <strong>Objection</strong> — object to processing based on legitimate interests.
            </li>
            <li>
              <strong>Withdraw consent</strong> — revoke analytics / error-reporting consent at any time (Settings →
              Privacy).
            </li>
          </ul>
          <p className="mt-2">
            To exercise any right, email{" "}
            <a href="mailto:privacy@flytehaus.studio" className="underline underline-offset-2">
              privacy@flytehaus.studio
            </a>
            . We respond within 30 days. You also have the right to lodge a complaint with your local supervisory
            authority (e.g. the ICO in the UK, or your national DPA in the EU).
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">9. California Privacy Rights (CCPA / CPRA)</h2>
          <p className="mt-2">
            California residents have additional rights under the California Consumer Privacy Act as amended by the
            California Privacy Rights Act, including the right to know, delete, correct, and opt out of sale or sharing
            of personal information. We do not sell or share personal information for cross-context behavioural
            advertising. To submit a verifiable consumer request, contact{" "}
            <a href="mailto:privacy@flytehaus.studio" className="underline underline-offset-2">
              privacy@flytehaus.studio
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">10. Cookies</h2>
          <p className="mt-2">
            We use strictly necessary cookies (session authentication, theme preference, locale) and, with your consent,
            analytics cookies (error telemetry via Sentry). You can manage cookie preferences via the consent banner or
            Settings → Privacy. Blocking strictly necessary cookies will prevent login.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">11. Children</h2>
          <p className="mt-2">
            The Service is not directed at individuals under 16. We do not knowingly collect personal data from children.
            If you believe we have inadvertently collected such data, contact us immediately.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">12. Changes to This Policy</h2>
          <p className="mt-2">
            We will notify you of material changes by email or in-app notice at least 14 days before they take effect.
            Continued use of the Service after the effective date constitutes acceptance.
          </p>
        </section>
      </div>
    </div>
  );
}
