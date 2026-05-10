import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How LYTEHAUS Technologies collects, uses, and protects your personal data.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Privacy Policy</h1>
      <p className="mt-4 text-xs text-[var(--text-muted)]">Last updated: 2026-05-10 · Effective: 2026-05-10</p>

      <div className="mt-8 space-y-8 text-sm text-[var(--text-secondary)]">

        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">1. Who We Are</h2>
          <p className="mt-2">
            LYTEHAUS Technologies (&ldquo;LYTEHAUS,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;),
            a GHXSTSHIP Industries company, operates the ATLVS, GVTEWAY, and COMPVSS platform (the &ldquo;Service&rdquo;)
            accessible at <span className="font-mono text-[var(--foreground)]">lytehaus.live</span> and its
            subdomains. For GDPR purposes, LYTEHAUS Technologies is the data controller.
          </p>
          <p className="mt-2">
            <strong className="text-[var(--foreground)]">Contact:</strong> privacy@lytehaus.live ·
            Data Protection Inquiries: dpo@lytehaus.live
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">2. Data We Collect</h2>
          <ul className="mt-2 space-y-2 pl-4">
            <li>
              <strong className="text-[var(--foreground)]">Account data:</strong> Name, work email address,
              hashed password (Supabase Auth), organization name, and role.
            </li>
            <li>
              <strong className="text-[var(--foreground)]">Workspace content:</strong> Projects, tickets, deliverables,
              invoices, crew records, schedules, and other operational data you create or upload.
            </li>
            <li>
              <strong className="text-[var(--foreground)]">Usage telemetry:</strong> Page views, feature interactions,
              API response times, and error traces. Collected pseudonymously; no behavioral advertising.
            </li>
            <li>
              <strong className="text-[var(--foreground)]">Device &amp; connection data:</strong> IP address,
              browser type, and device identifiers collected automatically for security and rate-limiting.
            </li>
            <li>
              <strong className="text-[var(--foreground)]">Payment data:</strong> Billing address and last-four digits
              of card. Full card details are processed by Stripe — we never store raw card numbers.
            </li>
            <li>
              <strong className="text-[var(--foreground)]">Communications:</strong> Support messages and feedback
              you send us.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">3. Legal Bases for Processing (GDPR)</h2>
          <ul className="mt-2 space-y-2 pl-4">
            <li><strong className="text-[var(--foreground)]">Contract performance</strong> (Art. 6(1)(b)): account provisioning, service delivery, billing.</li>
            <li><strong className="text-[var(--foreground)]">Legitimate interests</strong> (Art. 6(1)(f)): fraud prevention, security monitoring, product analytics, support.</li>
            <li><strong className="text-[var(--foreground)]">Consent</strong> (Art. 6(1)(a)): optional analytics cookies, marketing communications. Withdraw at any time in Settings → Privacy.</li>
            <li><strong className="text-[var(--foreground)]">Legal obligation</strong> (Art. 6(1)(c)): tax records, regulatory compliance.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">4. How We Use Your Data</h2>
          <ul className="mt-2 space-y-1 pl-4">
            <li>Provide, operate, and improve the Service.</li>
            <li>Authenticate users and enforce organizational access controls.</li>
            <li>Process payments and issue invoices.</li>
            <li>Detect and prevent abuse, fraud, and security incidents.</li>
            <li>Send transactional emails (password resets, team invitations, billing receipts).</li>
            <li>Aggregate anonymized analytics to understand product usage.</li>
            <li>Comply with legal obligations.</li>
          </ul>
          <p className="mt-2 font-medium text-[var(--foreground)]">We do not sell your personal data.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">5. Cookies &amp; Tracking</h2>
          <p className="mt-2">We use cookies to:</p>
          <ul className="mt-2 space-y-1 pl-4">
            <li><strong className="text-[var(--foreground)]">Authentication:</strong> Supabase session cookies (strictly necessary, no consent required).</li>
            <li><strong className="text-[var(--foreground)]">Preferences:</strong> Theme and locale settings stored in browser localStorage.</li>
            <li><strong className="text-[var(--foreground)]">Analytics:</strong> Pseudonymous usage events via our internal telemetry pipeline. You may opt out in the cookie banner or Settings → Privacy.</li>
          </ul>
          <p className="mt-2">
            We do not use third-party advertising cookies or cross-site tracking pixels.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">6. Subprocessors</h2>
          <p className="mt-2">We share data with the following vetted subprocessors under data processing agreements:</p>
          <ul className="mt-2 space-y-1 pl-4">
            <li><strong className="text-[var(--foreground)]">Supabase Inc.</strong> — database hosting and authentication (US; SCCs apply).</li>
            <li><strong className="text-[var(--foreground)]">Stripe, Inc.</strong> — payment processing (US; SCCs apply).</li>
            <li><strong className="text-[var(--foreground)]">Anthropic, PBC</strong> — AI inference for the in-platform assistant (US; no training on your data per agreement).</li>
            <li><strong className="text-[var(--foreground)]">Vercel Inc.</strong> — edge hosting and CDN (US; SCCs apply).</li>
            <li><strong className="text-[var(--foreground)]">Resend</strong> — transactional email delivery (US; SCCs apply).</li>
            <li><strong className="text-[var(--foreground)]">Sentry</strong> — error monitoring (US; SCCs apply; PII scrubbed before transmission).</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">7. International Data Transfers</h2>
          <p className="mt-2">
            All subprocessors above are located in the United States. Where you are in the EEA, UK, or Switzerland,
            transfers are covered by Standard Contractual Clauses (EU SCCs 2021/914) and, for the UK, the UK IDTA.
            A copy of our transfer mechanisms is available on request at privacy@lytehaus.live.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">8. Data Retention</h2>
          <ul className="mt-2 space-y-1 pl-4">
            <li>Account and workspace data: retained while your organization account is active.</li>
            <li>Audit logs: 90 days rolling, then purged.</li>
            <li>Billing records: 7 years (legal/tax obligation).</li>
            <li>Deleted accounts: anonymized within 30 days of deletion request.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">9. Your Rights</h2>
          <p className="mt-2">
            Depending on your jurisdiction, you may have the following rights regarding your personal data:
          </p>
          <ul className="mt-2 space-y-1 pl-4">
            <li><strong className="text-[var(--foreground)]">Access</strong> — obtain a copy of your data (Settings → Compliance → Export).</li>
            <li><strong className="text-[var(--foreground)]">Rectification</strong> — correct inaccurate data.</li>
            <li><strong className="text-[var(--foreground)]">Erasure</strong> — request deletion of your account and associated personal data.</li>
            <li><strong className="text-[var(--foreground)]">Restriction</strong> — ask us to limit processing in certain circumstances.</li>
            <li><strong className="text-[var(--foreground)]">Portability</strong> — receive your data in a machine-readable format.</li>
            <li><strong className="text-[var(--foreground)]">Objection</strong> — object to processing based on legitimate interests.</li>
            <li><strong className="text-[var(--foreground)]">Withdraw consent</strong> — for analytics/marketing, at any time.</li>
          </ul>
          <p className="mt-2">
            To exercise any right, contact dpo@lytehaus.live. We respond within 30 days. EEA/UK residents may
            lodge a complaint with their local supervisory authority.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">10. California Privacy Rights (CCPA / CPRA)</h2>
          <p className="mt-2">
            California residents have the right to know what personal information we collect, to delete it,
            to correct it, and to opt out of its sale (we do not sell personal information). To submit a
            request, email privacy@lytehaus.live with subject &ldquo;CCPA Request.&rdquo; We do not discriminate
            against users who exercise these rights.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">11. Security</h2>
          <p className="mt-2">
            We enforce TLS 1.2+ in transit, AES-256 at rest, row-level access controls, MFA enforcement
            by role, and continuous audit logging. See <a href="/security" className="underline">security.md</a> for
            our responsible disclosure policy.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">12. Children</h2>
          <p className="mt-2">
            The Service is not directed at children under 16. We do not knowingly collect data from minors.
            Contact us immediately if you believe a minor has provided us data.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">13. Changes to This Policy</h2>
          <p className="mt-2">
            We will notify account owners by email at least 30 days before material changes take effect.
            Continued use after the effective date constitutes acceptance.
          </p>
        </section>

      </div>
    </div>
  );
}
