import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Terms of Service",
  description: "LYTEHAUS Technologies Terms of Service — your rights and obligations when using ATLVS, GVTEWAY, and COMPVSS.",
  path: "/legal/terms",
  noIndex: false,
});

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Terms of Service</h1>
      <p className="mt-4 text-xs text-[var(--text-muted)]">Last updated: 2026-05-10</p>
      <div className="mt-8 space-y-6 text-sm text-[var(--text-secondary)]">
        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">1. Acceptance of Terms</h2>
          <p className="mt-2">
            By accessing or using the LYTEHAUS Technologies platform you agree to these Terms. If you do not agree, do
            not use the Service.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">2. Accounts</h2>
          <p className="mt-2">
            You are responsible for safeguarding the credentials used to access your account and for any activity under
            your account.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">3. Subscription &amp; Billing</h2>
          <p className="mt-2">
            Paid plans are billed via Stripe. Taxes, cancellation, and refund policies are documented in your in-app
            billing settings.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">4. Data Ownership</h2>
          <p className="mt-2">
            You own the content you upload. We process it solely to provide the Service. Export at any time from
            Settings → Compliance.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">5. Termination</h2>
          <p className="mt-2">
            Either party may terminate at any time. Your data remains exportable for 30 days post-termination.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">6. Acceptable Use</h2>
          <p className="mt-2">
            You may not use the Service to: (a) violate applicable law; (b) infringe third-party intellectual property;
            (c) transmit malware or conduct denial-of-service attacks; (d) resell or sub-license access without written
            consent.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">7. Limitation of Liability</h2>
          <p className="mt-2">
            To the maximum extent permitted by law, our aggregate liability is limited to the fees paid in the 12 months
            preceding the claim. We are not liable for indirect, incidental, or consequential damages.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">8. Governing Law &amp; Jurisdiction</h2>
          <p className="mt-2">
            These Terms are governed by the laws of the State of Delaware, United States, without regard to conflict-of-law
            principles. Disputes shall be resolved exclusively in the state or federal courts located in Delaware, and
            each party consents to personal jurisdiction therein.
          </p>
          <p className="mt-2">
            For customers located in the European Economic Area or United Kingdom, mandatory statutory consumer
            protections under applicable local law are not affected by this choice of law.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">9. Changes to These Terms</h2>
          <p className="mt-2">
            We will provide at least 30 days&apos; notice of material changes via email and in-app notification.
            Continued use after the effective date constitutes acceptance.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">10. Contact</h2>
          <p className="mt-2">
            Legal inquiries:{" "}
            <a href="mailto:legal@lytehaus.live" className="text-[var(--org-primary)] underline">
              legal@lytehaus.live
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
