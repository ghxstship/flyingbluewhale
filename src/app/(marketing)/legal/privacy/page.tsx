import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How LYTEHAUS Technologies collects, uses, and protects your personal data.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Privacy Policy</h1>
      <p className="mt-2 text-xs text-[var(--text-muted)]">Effective date: 2026-05-11 · Last updated: 2026-05-11</p>
      <p className="mt-4 text-sm text-[var(--text-secondary)]">
        This Privacy Policy explains how <strong>LYTEHAUS Technologies</strong>, a{" "}
        <span className="font-medium tracking-[0.12em]">G H X S T S H I P</span> Industries company
        (&ldquo;LYTEHAUS,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;), collects, uses, discloses,
        and safeguards personal data when you use the ATLVS, GVTEWAY, and COMPVSS platforms and our marketing website
        at lytehaus.live (collectively, the &ldquo;Services&rdquo;).
      </p>

      <div className="mt-10 space-y-10 text-sm text-[var(--text-secondary)]">

        {/* 1. Data Controller */}
        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">1. Data Controller</h2>
          <p className="mt-2">
            LYTEHAUS Technologies is the data controller for personal data processed in connection with the Services.
            For privacy inquiries, data subject requests, or to reach our privacy team:
          </p>
          <address className="not-italic mt-3 rounded border border-[var(--border-color)] bg-[var(--bg-secondary)] p-4 text-xs leading-relaxed">
            <strong>LYTEHAUS Technologies — Privacy</strong><br />
            A <span className="tracking-[0.12em]">G H X S T S H I P</span> Industries company<br />
            privacy@lytehaus.live<br />
            For GDPR requests: dpo@lytehaus.live
          </address>
        </section>

        {/* 2. Data We Collect */}
        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">2. Personal Data We Collect</h2>
          <div className="mt-2 space-y-3">
            <div>
              <p className="font-medium text-[var(--foreground)]">Account &amp; Identity</p>
              <p className="mt-1">
                Name, email address, profile photo, job title, organisation affiliation, and authentication credentials
                (password hash or OAuth token reference) when you create an account.
              </p>
            </div>
            <div>
              <p className="font-medium text-[var(--foreground)]">Workspace Content</p>
              <p className="mt-1">
                Documents, proposals, invoices, event data, crew records, vendor records, and other content you upload
                or create within the Services. This data belongs to you or your organisation.
              </p>
            </div>
            <div>
              <p className="font-medium text-[var(--foreground)]">Usage &amp; Technical Data</p>
              <p className="mt-1">
                IP address (truncated to /24 before storage), browser type, device identifiers, pages visited, features
                used, API response times, and error events. This is collected to operate and improve the Services.
              </p>
            </div>
            <div>
              <p className="font-medium text-[var(--foreground)]">Communications</p>
              <p className="mt-1">
                If you contact us by email or through the help centre, we retain those communications to respond and
                for quality assurance.
              </p>
            </div>
            <div>
              <p className="font-medium text-[var(--foreground)]">Payment Information</p>
              <p className="mt-1">
                Billing details are collected and processed by our payment processor, Stripe. We store only a tokenised
                reference — we never hold full card numbers or CVVs.
              </p>
            </div>
          </div>
        </section>

        {/* 3. Legal Bases (GDPR) */}
        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">3. Legal Bases for Processing (GDPR Art. 6)</h2>
          <p className="mt-2">
            For users in the European Economic Area (EEA), United Kingdom, or Switzerland, we rely on the following
            legal bases:
          </p>
          <ul className="mt-3 space-y-2 list-disc list-inside">
            <li>
              <strong>Contract (Art. 6(1)(b)):</strong> Processing necessary to provide the Services under our Terms of
              Service — account management, workspace operations, billing, customer support.
            </li>
            <li>
              <strong>Legitimate Interests (Art. 6(1)(f)):</strong> Security monitoring, fraud prevention, product
              analytics (aggregate), and service improvement, where these interests are not overridden by your rights.
            </li>
            <li>
              <strong>Consent (Art. 6(1)(a)):</strong> Analytics and marketing cookies — you may withdraw consent at
              any time via the cookie preference centre (accessible from any page footer or your account privacy
              settings).
            </li>
            <li>
              <strong>Legal Obligation (Art. 6(1)(c)):</strong> Where we must retain records to comply with applicable
              law (e.g. tax, anti-money laundering).
            </li>
          </ul>
        </section>

        {/* 4. How We Use Data */}
        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">4. How We Use Your Data</h2>
          <ul className="mt-2 space-y-1.5 list-disc list-inside">
            <li>Provide, operate, and maintain the Services.</li>
            <li>Authenticate your identity and enforce access controls.</li>
            <li>Send transactional notifications (password resets, invitations, billing receipts).</li>
            <li>Respond to support requests and communicate product updates (with your consent where required).</li>
            <li>Detect, prevent, and investigate fraud, abuse, or security incidents.</li>
            <li>Comply with legal obligations and enforce our Terms of Service.</li>
            <li>Aggregate, anonymised product analytics — we do not sell data or build ad profiles.</li>
          </ul>
        </section>

        {/* 5. Subprocessors */}
        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">5. Subprocessors &amp; International Transfers</h2>
          <p className="mt-2">
            We engage the following key subprocessors. Each is bound by a Data Processing Agreement (DPA) and, where
            data is transferred outside the EEA/UK, by Standard Contractual Clauses (SCCs) or an adequacy decision.
          </p>
          <div className="mt-3 overflow-x-auto">
            <table className="data-table w-full text-xs">
              <thead>
                <tr>
                  <th className="text-left">Subprocessor</th>
                  <th className="text-left">Purpose</th>
                  <th className="text-left">Location</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Supabase", "Database hosting, authentication, file storage", "USA (AWS us-east-1) — SCCs"],
                  ["Stripe", "Payment processing, connect payouts", "USA — SCCs"],
                  ["Anthropic", "AI assistant (ATLVS only)", "USA — SCCs"],
                  ["Vercel", "Edge CDN, serverless functions", "Global — SCCs"],
                  ["Resend", "Transactional email delivery", "USA — SCCs"],
                  ["Upstash", "Rate-limit cache (Redis)", "USA — SCCs"],
                  ["Sentry", "Error monitoring (PII scrubbed before transmission)", "USA — SCCs"],
                ].map(([name, purpose, location]) => (
                  <tr key={name}>
                    <td className="font-medium">{name}</td>
                    <td>{purpose}</td>
                    <td>{location}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3">
            A full list of subprocessors is available at <strong>lytehaus.live/legal/dpa</strong>. Enterprise customers
            may request 30 days' advance notice of subprocessor changes.
          </p>
        </section>

        {/* 6. Cookies */}
        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">6. Cookies &amp; Tracking Technologies</h2>
          <p className="mt-2">
            We use cookies and similar storage mechanisms. You can manage your preferences at any time via the{" "}
            <strong>Cookie Preferences</strong> link in the footer or your account&apos;s Privacy settings.
          </p>
          <div className="mt-3 overflow-x-auto">
            <table className="data-table w-full text-xs">
              <thead>
                <tr>
                  <th className="text-left">Category</th>
                  <th className="text-left">Examples</th>
                  <th className="text-left">Basis</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Essential", "Session authentication (Supabase auth-token), CSRF, rate-limit identifiers", "Contract / Legitimate Interest — cannot be opted out"],
                  ["Preferences", "Theme (lh_mode), density (lh_density)", "Legitimate Interest — cannot be opted out"],
                  ["Analytics", "Aggregate pageview events, Web Vitals (no cross-site tracking)", "Consent"],
                  ["Marketing", "Conversion tracking on the marketing site only", "Consent"],
                ].map(([cat, examples, basis]) => (
                  <tr key={cat}>
                    <td className="font-medium">{cat}</td>
                    <td>{examples}</td>
                    <td>{basis}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 7. Retention */}
        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">7. Data Retention</h2>
          <div className="mt-2 space-y-2">
            <p>
              <strong>Account data:</strong> Retained for the life of your account. Upon deletion, your account is
              soft-deleted immediately and permanently purged within 30 days.
            </p>
            <p>
              <strong>Workspace content:</strong> Retained until you delete it or your organisation is deleted, subject
              to a 30-day purge window.
            </p>
            <p>
              <strong>Audit logs:</strong> 90 days by default; Enterprise plans may configure up to 7 years.
            </p>
            <p>
              <strong>Error / telemetry events:</strong> 30 days in our error monitoring system (Sentry). Aggregate
              metrics are retained indefinitely in anonymised form.
            </p>
            <p>
              <strong>Financial records:</strong> Retained for 7 years from the date of a transaction to comply with
              applicable tax and accounting obligations.
            </p>
          </div>
        </section>

        {/* 8. Your Rights */}
        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">8. Your Rights</h2>
          <p className="mt-2">
            Subject to applicable law, you have the following rights regarding your personal data. To exercise any of
            these rights, contact us at <strong>privacy@lytehaus.live</strong> or use the self-service tools in your
            account (Settings → Privacy).
          </p>
          <ul className="mt-3 space-y-2 list-disc list-inside">
            <li>
              <strong>Access (Art. 15 GDPR / CCPA):</strong> Request a copy of the personal data we hold about you.
              Use the &ldquo;Export My Data&rdquo; feature for an immediate machine-readable download.
            </li>
            <li>
              <strong>Rectification (Art. 16 GDPR):</strong> Correct inaccurate or incomplete data via your account
              profile, or contact us for fields you cannot edit.
            </li>
            <li>
              <strong>Erasure (Art. 17 GDPR / CCPA &ldquo;right to delete&rdquo;):</strong> Delete your account and
              all associated personal data. Available in Settings → Privacy → Delete Account.
            </li>
            <li>
              <strong>Portability (Art. 20 GDPR):</strong> Receive your data in a structured, machine-readable format
              (JSON). Use the export feature or contact us.
            </li>
            <li>
              <strong>Restriction (Art. 18 GDPR):</strong> Ask us to restrict processing of your data in certain
              circumstances — for example, while you contest its accuracy.
            </li>
            <li>
              <strong>Objection (Art. 21 GDPR):</strong> Object to processing based on legitimate interests. We will
              stop unless we can demonstrate compelling grounds.
            </li>
            <li>
              <strong>Withdraw Consent:</strong> Where processing is based on consent (analytics, marketing cookies),
              you may withdraw at any time without affecting the lawfulness of prior processing.
            </li>
            <li>
              <strong>California Rights (CCPA/CPRA):</strong> California residents also have rights to opt out of the
              sale or sharing of personal data. We do not sell personal data. You may submit a verifiable request via
              privacy@lytehaus.live.
            </li>
          </ul>
          <p className="mt-3">
            We respond to verified requests within <strong>30 days</strong> (or 45 days where an extension is permitted
            by law). If we cannot fulfil a request, we will explain why.
          </p>
        </section>

        {/* 9. Supervisory Authority */}
        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">9. Right to Lodge a Complaint</h2>
          <p className="mt-2">
            If you are in the EEA or UK and believe we have not handled your personal data in accordance with applicable
            law, you have the right to lodge a complaint with your local supervisory authority — for example, the UK
            Information Commissioner&apos;s Office (ICO) at{" "}
            <strong>ico.org.uk</strong>, or the relevant Data Protection Authority in your EU member state.
          </p>
          <p className="mt-2">
            We encourage you to contact us first at <strong>privacy@lytehaus.live</strong> so we can try to resolve
            your concern directly.
          </p>
        </section>

        {/* 10. Automated Decision-Making */}
        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">10. Automated Decision-Making &amp; Profiling</h2>
          <p className="mt-2">
            We do not use automated decision-making or profiling that produces legal or similarly significant effects on
            individuals. Our AI assistant (ATLVS) generates suggestions and drafts but all consequential decisions
            (approvals, payments, scheduling) remain with human users.
          </p>
        </section>

        {/* 11. Children */}
        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">11. Children&apos;s Privacy</h2>
          <p className="mt-2">
            The Services are not directed at children under 16 (or the applicable minimum age in your jurisdiction).
            We do not knowingly collect personal data from children. If you believe a child has provided us with
            personal data, please contact <strong>privacy@lytehaus.live</strong> and we will delete it promptly.
          </p>
        </section>

        {/* 12. Security */}
        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">12. Security</h2>
          <p className="mt-2">
            We implement technical and organisational measures appropriate to the risk: encryption in transit (TLS 1.3)
            and at rest (AES-256), row-level security on every database table, multi-factor authentication support,
            SOC 2-aligned controls, audit logging of sensitive operations, and regular penetration testing. No system
            is perfectly secure — if you discover a vulnerability, please report it responsibly to{" "}
            <strong>security@lytehaus.live</strong>.
          </p>
        </section>

        {/* 13. Changes */}
        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">13. Changes to This Policy</h2>
          <p className="mt-2">
            We may update this policy from time to time. We will notify you of material changes by posting a notice in
            the product at least 14 days before the change takes effect, or by email for changes that significantly
            affect your rights. Continuing to use the Services after the effective date constitutes acceptance of the
            updated policy.
          </p>
        </section>

        {/* 14. Contact */}
        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">14. Contact Us</h2>
          <p className="mt-2">
            For general privacy questions, data subject requests, or to exercise your rights:
          </p>
          <address className="not-italic mt-3 rounded border border-[var(--border-color)] bg-[var(--bg-secondary)] p-4 text-xs leading-relaxed">
            <strong>LYTEHAUS Technologies — Privacy Team</strong><br />
            privacy@lytehaus.live<br />
            <br />
            For GDPR / Data Protection Officer enquiries:<br />
            dpo@lytehaus.live
          </address>
        </section>
      </div>
    </div>
  );
}
