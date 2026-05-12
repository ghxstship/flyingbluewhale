import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Privacy Policy",
  description: "How FLYTEHAUS Technologies collects, uses, and protects your personal data.",
  path: "/legal/privacy",
  noIndex: false,
});

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Privacy Policy</h1>
      <p className="mt-4 text-xs text-[var(--text-muted)]">Last updated: 2026-05-12</p>

      <div className="mt-8 space-y-8 text-sm text-[var(--text-secondary)]">
        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">1. Controller</h2>
          <p className="mt-2">
            FLYTEHAUS Technologies, a GHXSTSHIP Industries company, is the data controller for personal data processed
            through the ATLVS, GVTEWAY, and COMPVSS platforms. Contact:{" "}
            <a href="mailto:privacy@flytehaus.live" className="underline underline-offset-4">
              privacy@flytehaus.live
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">2. What We Collect</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              <strong>Account data:</strong> email address, name, role, organization membership.
            </li>
            <li>
              <strong>Workspace content:</strong> projects, tasks, deliverables, invoices, crew profiles, and other
              records you create inside the platform.
            </li>
            <li>
              <strong>Usage telemetry:</strong> pageviews, API response times, error traces (Sentry — no PII in stack
              traces by policy).
            </li>
            <li>
              <strong>Cookies &amp; local storage:</strong> authentication session, theme preference, consent record.
              See the cookie banner for category details.
            </li>
            <li>
              <strong>Device &amp; network:</strong> IP address (rate limiting and fraud prevention only; purged from
              logs within 30 days), browser user-agent.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">3. Legal Basis (GDPR Art. 6)</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              <strong>Contract performance (Art. 6(1)(b)):</strong> providing the SaaS service you subscribed to,
              including auth, billing, and core product features.
            </li>
            <li>
              <strong>Legitimate interests (Art. 6(1)(f)):</strong> security monitoring, abuse prevention, aggregated
              product analytics.
            </li>
            <li>
              <strong>Consent (Art. 6(1)(a)):</strong> marketing cookies and conversion tracking — only when you opt in
              via the cookie banner.
            </li>
            <li>
              <strong>Legal obligation (Art. 6(1)(c)):</strong> tax records, GDPR audit log retention.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">4. How We Use It</h2>
          <p className="mt-2">
            We use your data exclusively to deliver, secure, and improve the Service. We do not sell personal data to
            third parties, build advertising profiles, or share data with data brokers.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">5. Subprocessors</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              <strong>Supabase</strong> — database hosting and authentication (EU region by default).
            </li>
            <li>
              <strong>Vercel</strong> — edge CDN and serverless compute.
            </li>
            <li>
              <strong>Stripe</strong> — payment processing and Stripe Connect payouts.
            </li>
            <li>
              <strong>Anthropic</strong> — AI inference for the in-product assistant (data not used for model training
              under our API agreement).
            </li>
            <li>
              <strong>Resend</strong> — transactional email delivery.
            </li>
            <li>
              <strong>Sentry</strong> — error monitoring (PII scrubbed before transmission).
            </li>
          </ul>
          <p className="mt-2">
            All subprocessors are bound by our{" "}
            <Link href="/legal/dpa" className="underline underline-offset-4">
              Data Processing Addendum
            </Link>{" "}
            and operate under adequate safeguards (EU SCCs or equivalent) for international transfers.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">6. Retention</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              <strong>Audit logs:</strong> 90 days by default; extendable to 12 months on Enterprise.
            </li>
            <li>
              <strong>Workspace content:</strong> retained until you delete it or your organization is terminated.
            </li>
            <li>
              <strong>IP addresses in logs:</strong> purged within 30 days.
            </li>
            <li>
              <strong>Billing records:</strong> 7 years (legal obligation).
            </li>
            <li>
              <strong>Backup snapshots:</strong> 30-day rolling window.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">7. Your Rights (GDPR Arts. 15–22)</h2>
          <p className="mt-2">
            If you are in the EEA, UK, or Switzerland, you have the right to:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              <strong>Access</strong> — obtain a copy of your personal data.
            </li>
            <li>
              <strong>Rectification</strong> — correct inaccurate data.
            </li>
            <li>
              <strong>Erasure</strong> — request deletion ("right to be forgotten").
            </li>
            <li>
              <strong>Portability</strong> — receive your data in a machine-readable format.
            </li>
            <li>
              <strong>Restriction</strong> — limit how we process your data.
            </li>
            <li>
              <strong>Objection</strong> — object to processing based on legitimate interests.
            </li>
            <li>
              <strong>Withdraw consent</strong> — at any time, for consent-based processing (e.g. marketing cookies).
            </li>
          </ul>
          <p className="mt-2">
            Submit a Data Subject Access Request (DSAR) at{" "}
            <strong>Settings → Privacy</strong> inside the console, or email{" "}
            <a href="mailto:privacy@flytehaus.live" className="underline underline-offset-4">
              privacy@flytehaus.live
            </a>
            . We respond within 30 days.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">8. California (CCPA / CPRA)</h2>
          <p className="mt-2">
            California residents have the right to know what personal information we collect, the right to delete it,
            and the right to opt out of any sale. We do not sell personal information. To exercise your rights, contact{" "}
            <a href="mailto:privacy@flytehaus.live" className="underline underline-offset-4">
              privacy@flytehaus.live
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">9. International Transfers</h2>
          <p className="mt-2">
            Your data may be processed in the United States and other countries where our subprocessors operate. For
            transfers from the EEA or UK, we rely on EU Standard Contractual Clauses (SCCs) and the UK International
            Data Transfer Addendum (IDTA). Our{" "}
            <Link href="/legal/dpa" className="underline underline-offset-4">
              DPA
            </Link>{" "}
            covers these transfer mechanisms.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">10. Security</h2>
          <p className="mt-2">
            Row-Level Security (RLS) enforced at the database layer. All data encrypted in transit (TLS 1.2+) and at
            rest (AES-256). SOC 2 Type II in progress via Supabase. Breach notification within 48 hours of confirmation
            to the controller, per our DPA.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">11. Supervisory Authority</h2>
          <p className="mt-2">
            If you are in the EEA, you have the right to lodge a complaint with your local data protection authority.
            A list of authorities is available at{" "}
            <a
              href="https://edpb.europa.eu/about-edpb/about-edpb/members_en"
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-4"
            >
              edpb.europa.eu
            </a>
            . UK residents may contact the ICO at{" "}
            <a
              href="https://ico.org.uk"
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-4"
            >
              ico.org.uk
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">12. Changes to This Policy</h2>
          <p className="mt-2">
            Material changes will be notified via the in-app notification system and email at least 14 days before they
            take effect. Continued use of the Service after that date constitutes acceptance.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">13. Contact</h2>
          <p className="mt-2">
            Privacy inquiries:{" "}
            <a href="mailto:privacy@flytehaus.live" className="underline underline-offset-4">
              privacy@flytehaus.live
            </a>
            <br />
            FLYTEHAUS Technologies, a GHXSTSHIP Industries company.
          </p>
        </section>
      </div>
    </div>
  );
}
