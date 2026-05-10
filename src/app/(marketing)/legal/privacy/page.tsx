import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Privacy Policy",
  description:
    "How LYTEHAUS Technologies collects, uses, and protects your personal data — your rights under GDPR, CCPA, and applicable privacy law.",
  path: "/legal/privacy",
  noIndex: false,
});

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Privacy Policy</h1>
      <p className="mt-4 text-xs text-[var(--text-muted)]">Last updated: 2026-05-10</p>
      <div className="mt-8 space-y-8 text-sm text-[var(--text-secondary)]">
        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">1. Data Controller</h2>
          <p className="mt-2">
            LYTEHAUS Technologies, a GHXSTSHIP Industries company, is the data controller for personal data processed
            through this platform. For privacy inquiries:{" "}
            <a href="mailto:privacy@lytehaus.live" className="text-[var(--org-primary)] underline">
              privacy@lytehaus.live
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">2. What We Collect</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              <strong>Account data:</strong> name, email address, job title, organisation name.
            </li>
            <li>
              <strong>Workspace content:</strong> files, messages, project data, and other content you upload or create.
            </li>
            <li>
              <strong>Usage and technical data:</strong> pageviews, feature interactions, error reports, API timing,
              IP address, browser/device type.
            </li>
            <li>
              <strong>Payment data:</strong> billing address and payment method tokens (full card details are processed
              by Stripe and never stored by us).
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">3. Legal Bases for Processing (GDPR)</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              <strong>Performance of a contract (Art. 6(1)(b)):</strong> account creation, delivering the Service,
              billing.
            </li>
            <li>
              <strong>Legitimate interests (Art. 6(1)(f)):</strong> security monitoring, fraud prevention, product
              improvement, and analytics — balanced against your rights.
            </li>
            <li>
              <strong>Consent (Art. 6(1)(a)):</strong> optional cookies and marketing communications — you may
              withdraw consent at any time.
            </li>
            <li>
              <strong>Legal obligation (Art. 6(1)(c)):</strong> tax records, regulatory reporting.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">4. How We Use It</h2>
          <p className="mt-2">
            To deliver, secure, and improve the Service. We do not sell personal data. We do not use your workspace
            content to train AI models without explicit consent.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">5. Subprocessors</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Supabase (database hosting — EU region)</li>
            <li>Stripe (payment processing)</li>
            <li>Anthropic (AI assistant features)</li>
            <li>Vercel (edge delivery and CDN)</li>
            <li>Sentry (error monitoring)</li>
            <li>Resend (transactional email)</li>
          </ul>
          <p className="mt-2">
            Each subprocessor is subject to a data processing agreement. Our full subprocessor list is available on
            request.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">6. International Transfers</h2>
          <p className="mt-2">
            Where personal data is transferred outside the EEA or UK, we rely on the EU Standard Contractual Clauses
            (SCCs) and UK IDTA as appropriate. A copy of these safeguards is available on request.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">7. Retention</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Audit logs: 90 days by default (configurable per org on Enterprise plans).</li>
            <li>Workspace content: retained until you delete it or your account is deleted.</li>
            <li>After account deletion: residual backups purged within 30 days.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">8. Your Rights</h2>
          <p className="mt-2">
            Under GDPR (for EEA/UK residents) and CCPA (for California residents) you have the right to:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              <strong>Access</strong> a copy of your personal data.
            </li>
            <li>
              <strong>Rectification</strong> of inaccurate data.
            </li>
            <li>
              <strong>Erasure</strong> ("right to be forgotten") where no overriding legal basis applies.
            </li>
            <li>
              <strong>Restriction</strong> of processing while a dispute is resolved.
            </li>
            <li>
              <strong>Data portability</strong> — export your data in machine-readable format via Settings → Compliance.
            </li>
            <li>
              <strong>Object</strong> to processing based on legitimate interests.
            </li>
            <li>
              <strong>Withdraw consent</strong> at any time where processing relies on consent.
            </li>
          </ul>
          <p className="mt-2">
            To exercise any of these rights, email{" "}
            <a href="mailto:privacy@lytehaus.live" className="text-[var(--org-primary)] underline">
              privacy@lytehaus.live
            </a>
            . We will respond within 30 days. Self-service DSAR is available under Settings → Compliance → Data Export.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">9. Automated Decision-Making</h2>
          <p className="mt-2">
            We do not make solely automated decisions that produce legal or similarly significant effects on you.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">10. Cookies</h2>
          <p className="mt-2">
            We use strictly necessary cookies for session management and a theme preference cookie. Analytics and
            marketing cookies require your consent via the cookie banner. You may update your preferences at any time
            via the cookie settings link in the footer.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">11. Supervisory Authority</h2>
          <p className="mt-2">
            EEA residents may lodge a complaint with their national data protection authority. UK residents may contact
            the ICO at{" "}
            <a
              href="https://ico.org.uk"
              target="_blank"
              rel="noreferrer"
              className="text-[var(--org-primary)] underline"
            >
              ico.org.uk
            </a>
            . California residents may contact the CPPA at{" "}
            <a
              href="https://cppa.ca.gov"
              target="_blank"
              rel="noreferrer"
              className="text-[var(--org-primary)] underline"
            >
              cppa.ca.gov
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">12. Changes to This Policy</h2>
          <p className="mt-2">
            Material changes will be communicated by email and in-app notification at least 14 days before they take
            effect.
          </p>
        </section>
      </div>
    </div>
  );
}
