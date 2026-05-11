import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Privacy Policy — LYTEHAUS Technologies",
  description:
    "How LYTEHAUS Technologies collects, uses, and protects your personal data. GDPR, CCPA, and PIPEDA compliant.",
  path: "/legal/privacy",
});

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Privacy Policy</h1>
      <p className="mt-4 text-xs text-[var(--text-muted)]">Last updated: 2026-05-01 · Effective: 2026-05-01</p>
      <p className="mt-4 text-sm text-[var(--text-secondary)]">
        This policy applies to <strong>LYTEHAUS Technologies</strong> (&ldquo;LYTEHAUS&rdquo;, &ldquo;we&rdquo;,
        &ldquo;us&rdquo;) and our three products: <strong>ATLVS</strong>, <strong>GVTEWAY</strong>, and{" "}
        <strong>COMPVSS</strong>. Where applicable, LYTEHAUS acts as both data controller (for account and product data)
        and data processor (when processing personal data on behalf of an organisation customer).
      </p>
      <div className="mt-8 space-y-8 text-sm text-[var(--text-secondary)]">
        <section aria-labelledby="collect-heading">
          <h2 id="collect-heading" className="text-base font-semibold text-[var(--foreground)]">
            1. What We Collect
          </h2>
          <ul className="mt-2 list-disc space-y-1 ps-5">
            <li>
              <strong>Account data:</strong> name, email address, password hash, and profile information you provide at
              sign-up.
            </li>
            <li>
              <strong>Workspace content:</strong> projects, proposals, invoices, documents, and other data you upload or
              generate in the Service.
            </li>
            <li>
              <strong>Usage telemetry:</strong> page views, API timing, error traces, and feature interactions to operate
              and improve the Service.
            </li>
            <li>
              <strong>Device &amp; connection data:</strong> IP address, browser user-agent, and session metadata
              required for security and rate-limiting.
            </li>
            <li>
              <strong>Payment data:</strong> billing name and address; card details are processed directly by Stripe and
              are never stored on our servers.
            </li>
          </ul>
        </section>

        <section aria-labelledby="use-heading">
          <h2 id="use-heading" className="text-base font-semibold text-[var(--foreground)]">
            2. How We Use It
          </h2>
          <ul className="mt-2 list-disc space-y-1 ps-5">
            <li>To provide, operate, and improve the Service.</li>
            <li>To authenticate users and enforce access controls.</li>
            <li>To detect and prevent fraud, abuse, and security incidents.</li>
            <li>To send transactional emails (password resets, invoices, invite notifications).</li>
            <li>
              To send product updates and announcements — you may opt out at any time via your notification preferences.
            </li>
          </ul>
          <p className="mt-2">We do not sell, rent, or share customer data with third parties for advertising.</p>
        </section>

        <section aria-labelledby="basis-heading">
          <h2 id="basis-heading" className="text-base font-semibold text-[var(--foreground)]">
            3. Legal Basis for Processing (GDPR)
          </h2>
          <ul className="mt-2 list-disc space-y-1 ps-5">
            <li>
              <strong>Contract performance</strong> — processing necessary to deliver the Service you subscribed to.
            </li>
            <li>
              <strong>Legitimate interests</strong> — security monitoring, fraud prevention, and product analytics.
            </li>
            <li>
              <strong>Consent</strong> — optional cookies and marketing communications (cookie banner; opt-in at
              sign-up).
            </li>
            <li>
              <strong>Legal obligation</strong> — retaining records required by applicable financial or tax law.
            </li>
          </ul>
        </section>

        <section aria-labelledby="subprocessors-heading">
          <h2 id="subprocessors-heading" className="text-base font-semibold text-[var(--foreground)]">
            4. Subprocessors
          </h2>
          <p className="mt-2">
            We engage the following subprocessors, each subject to contractual data-protection obligations:
          </p>
          <ul className="mt-2 list-disc space-y-1 ps-5">
            <li>
              <strong>Supabase</strong> — database hosting and authentication.
            </li>
            <li>
              <strong>Vercel</strong> — edge compute and CDN.
            </li>
            <li>
              <strong>Stripe</strong> — payment processing and payouts.
            </li>
            <li>
              <strong>Anthropic</strong> — AI assistant feature (prompts processed to generate responses; not used to
              train models).
            </li>
            <li>
              <strong>Sentry</strong> — error monitoring and performance tracing.
            </li>
          </ul>
        </section>

        <section aria-labelledby="transfers-heading">
          <h2 id="transfers-heading" className="text-base font-semibold text-[var(--foreground)]">
            5. International Data Transfers
          </h2>
          <p className="mt-2">
            Your data may be processed in the United States and other countries where our subprocessors operate. For
            transfers from the European Economic Area, we rely on Standard Contractual Clauses (SCCs) and, where
            applicable, the UK International Data Transfer Agreement.
          </p>
        </section>

        <section aria-labelledby="retention-heading">
          <h2 id="retention-heading" className="text-base font-semibold text-[var(--foreground)]">
            6. Retention
          </h2>
          <ul className="mt-2 list-disc space-y-1 ps-5">
            <li>
              <strong>Audit logs:</strong> 90 days by default; extended retention available on Enterprise plans.
            </li>
            <li>
              <strong>Workspace content:</strong> retained until you delete it or your organisation account is deleted.
            </li>
            <li>
              <strong>Billing records:</strong> retained for 7 years as required by applicable tax law.
            </li>
            <li>
              <strong>Deleted accounts:</strong> anonymised within 30 days of deletion request; backups purged within 90
              days.
            </li>
          </ul>
        </section>

        <section aria-labelledby="rights-heading">
          <h2 id="rights-heading" className="text-base font-semibold text-[var(--foreground)]">
            7. Your Rights
          </h2>
          <p className="mt-2">
            Depending on your jurisdiction, you may have the following rights. To exercise any of them, contact us at{" "}
            <a href="mailto:privacy@lytehaus.live" className="underline underline-offset-4">
              privacy@lytehaus.live
            </a>
            . We will respond within 30 days (GDPR) or 45 days (CCPA).
          </p>
          <ul className="mt-2 list-disc space-y-1 ps-5">
            <li>
              <strong>Access</strong> — obtain a copy of the personal data we hold about you.
            </li>
            <li>
              <strong>Rectification</strong> — correct inaccurate or incomplete data.
            </li>
            <li>
              <strong>Erasure (&ldquo;right to be forgotten&rdquo;)</strong> — request deletion of your personal data
              where we have no overriding legal obligation to retain it.
            </li>
            <li>
              <strong>Restriction</strong> — ask us to stop processing while a dispute is resolved.
            </li>
            <li>
              <strong>Portability</strong> — receive your data in a machine-readable format.
            </li>
            <li>
              <strong>Objection</strong> — object to processing based on legitimate interests.
            </li>
            <li>
              <strong>Withdraw consent</strong> — revoke consent at any time without affecting prior processing.
            </li>
            <li>
              <strong>CCPA / CPRA</strong> — California residents may additionally opt out of the &ldquo;sale&rdquo; or
              &ldquo;sharing&rdquo; of personal information (we do not sell or share data) and exercise the right to
              non-discrimination.
            </li>
          </ul>
          <p className="mt-2">
            You may also submit a complaint to your local data protection authority. For EEA residents this is typically
            the supervisory authority in your Member State.
          </p>
        </section>

        <section aria-labelledby="cookies-heading">
          <h2 id="cookies-heading" className="text-base font-semibold text-[var(--foreground)]">
            8. Cookies &amp; Tracking
          </h2>
          <p className="mt-2">
            We use strictly necessary cookies to maintain your session and theme preference. Analytics and performance
            cookies are optional and require your consent via the cookie banner shown on first visit. You may change your
            preferences at any time in your browser settings or at the bottom of any page.
          </p>
        </section>

        <section aria-labelledby="security-heading">
          <h2 id="security-heading" className="text-base font-semibold text-[var(--foreground)]">
            9. Security
          </h2>
          <p className="mt-2">
            We implement industry-standard safeguards including TLS in transit, encryption at rest, row-level security on
            every database table, MFA support, and regular penetration testing. See our{" "}
            <a href="/security" className="underline underline-offset-4">
              Security page
            </a>{" "}
            for details.
          </p>
        </section>

        <section aria-labelledby="contact-heading">
          <h2 id="contact-heading" className="text-base font-semibold text-[var(--foreground)]">
            10. Contact &amp; DPO
          </h2>
          <p className="mt-2">
            <strong>LYTEHAUS Technologies</strong>, a G H X S T S H I P Industries company.
          </p>
          <p className="mt-1">
            Data protection enquiries:{" "}
            <a href="mailto:privacy@lytehaus.live" className="underline underline-offset-4">
              privacy@lytehaus.live
            </a>
          </p>
          <p className="mt-1">
            General contact:{" "}
            <a href="mailto:hello@lytehaus.live" className="underline underline-offset-4">
              hello@lytehaus.live
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
