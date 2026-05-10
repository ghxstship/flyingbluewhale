import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "LYTEHAUS Technologies Terms of Service governing your use of ATLVS, GVTEWAY, and COMPVSS.",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Terms of Service</h1>
      <p className="mt-4 text-xs text-[var(--text-muted)]">Last updated: 2026-05-10 · Effective: 2026-05-10</p>

      <div className="mt-8 space-y-8 text-sm text-[var(--text-secondary)]">

        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">1. Acceptance</h2>
          <p className="mt-2">
            By accessing or using the LYTEHAUS Technologies platform (&ldquo;Service&rdquo;) — including ATLVS,
            GVTEWAY, and COMPVSS — you agree to these Terms of Service (&ldquo;Terms&rdquo;) and our
            <a href="/legal/privacy" className="underline"> Privacy Policy</a>. If you are entering into these Terms
            on behalf of an organization, you represent that you have authority to bind that organization.
            If you do not agree, do not use the Service.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">2. Definitions</h2>
          <ul className="mt-2 space-y-1 pl-4">
            <li><strong className="text-[var(--foreground)]">&ldquo;Service&rdquo;</strong> — the LYTEHAUS Technologies platform, APIs, and associated applications.</li>
            <li><strong className="text-[var(--foreground)]">&ldquo;Customer&rdquo;</strong> — the organization or individual that has subscribed to the Service.</li>
            <li><strong className="text-[var(--foreground)]">&ldquo;User&rdquo;</strong> — any person authorized by the Customer to access the Service.</li>
            <li><strong className="text-[var(--foreground)]">&ldquo;Customer Data&rdquo;</strong> — all data submitted to or created within the Service by the Customer or its Users.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">3. Accounts &amp; Access</h2>
          <p className="mt-2">
            You must provide accurate registration information and keep it current. You are responsible for
            safeguarding credentials and for all activity under your account. Notify us immediately at
            security@lytehaus.live of any unauthorized use. Multi-factor authentication is strongly
            recommended and may be required by your organization&apos;s policy.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">4. Subscriptions &amp; Billing</h2>
          <p className="mt-2">
            Paid plans are billed in advance via Stripe on a monthly or annual basis. All fees are exclusive
            of applicable taxes (VAT, GST, sales tax), which will be added at checkout where required by law.
            Subscriptions auto-renew until cancelled. Cancellation takes effect at the end of the current
            billing period; no refunds are issued for partial periods unless required by applicable law.
            Price changes will be communicated at least 30 days in advance.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">5. Customer Data &amp; Ownership</h2>
          <p className="mt-2">
            You retain all rights to Customer Data. By using the Service you grant LYTEHAUS Technologies a
            limited, worldwide, non-exclusive license to host, copy, and process Customer Data solely to
            provide the Service. We do not use Customer Data to train AI models. You can export your data
            at any time from Settings → Compliance.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">6. Acceptable Use</h2>
          <p className="mt-2">You agree not to:</p>
          <ul className="mt-2 space-y-1 pl-4">
            <li>Use the Service for any unlawful purpose or in violation of any applicable law or regulation.</li>
            <li>Transmit malware, unauthorized access attempts, or denial-of-service attacks.</li>
            <li>Scrape, reverse-engineer, or resell the Service without written permission.</li>
            <li>Upload content that infringes third-party intellectual property rights.</li>
            <li>Impersonate another person or organization.</li>
          </ul>
          <p className="mt-2">
            We reserve the right to suspend accounts that violate these rules, with notice where practicable.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">7. Intellectual Property</h2>
          <p className="mt-2">
            LYTEHAUS Technologies retains all rights to the Service, including software, design, trademarks,
            and documentation. ATLVS, GVTEWAY, and COMPVSS are registered trademarks of LYTEHAUS Technologies.
            Nothing in these Terms transfers ownership of the Service to you.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">8. Confidentiality</h2>
          <p className="mt-2">
            Each party agrees to keep confidential the other party&apos;s non-public business information and
            to use it solely for purposes of these Terms. This obligation survives termination for three years.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">9. Warranties &amp; Disclaimers</h2>
          <p className="mt-2">
            THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; WITHOUT WARRANTY OF ANY KIND. TO THE MAXIMUM EXTENT
            PERMITTED BY APPLICABLE LAW, LYTEHAUS TECHNOLOGIES DISCLAIMS ALL EXPRESS, IMPLIED, AND STATUTORY
            WARRANTIES, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND
            NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED OR ERROR-FREE.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">10. Limitation of Liability</h2>
          <p className="mt-2">
            TO THE FULLEST EXTENT PERMITTED BY LAW, LYTEHAUS TECHNOLOGIES WILL NOT BE LIABLE FOR ANY
            INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES. OUR AGGREGATE LIABILITY
            FOR ALL CLAIMS ARISING UNDER OR RELATED TO THESE TERMS SHALL NOT EXCEED THE FEES PAID BY YOU
            IN THE TWELVE MONTHS PRECEDING THE CLAIM.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">11. Indemnification</h2>
          <p className="mt-2">
            You agree to indemnify and hold harmless LYTEHAUS Technologies from any claim, loss, or expense
            (including reasonable legal fees) arising out of your use of the Service in violation of these
            Terms or applicable law.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">12. Termination</h2>
          <p className="mt-2">
            Either party may terminate at any time with written notice. We may terminate immediately for
            material breach. Upon termination your data remains exportable for 30 days, after which it is
            securely deleted. Sections 5, 8, 9, 10, 11, and 14 survive termination.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">13. Changes to Terms</h2>
          <p className="mt-2">
            We may update these Terms with 30 days&apos; notice via email to account owners. Continued use
            after the effective date constitutes acceptance. Material changes will be highlighted in the
            in-app notification center.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">14. Governing Law &amp; Dispute Resolution</h2>
          <p className="mt-2">
            These Terms are governed by the laws of the State of Florida, USA, without regard to its
            conflict-of-law provisions. Disputes shall first be submitted to good-faith negotiation for
            30 days. If unresolved, disputes shall be settled by binding arbitration under the JAMS
            Streamlined Arbitration Rules in Miami-Dade County, Florida. Class actions and jury trials
            are waived to the fullest extent permitted by law. Nothing herein prevents either party from
            seeking injunctive relief in a court of competent jurisdiction. Consumers in the EEA or UK
            may also bring claims before the courts of their country of residence.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">15. General</h2>
          <p className="mt-2">
            These Terms constitute the entire agreement between the parties regarding the Service and
            supersede all prior agreements. If any provision is held invalid, the remaining provisions
            remain in effect. Failure to enforce any right does not constitute a waiver. Notices to
            LYTEHAUS Technologies should be sent to legal@lytehaus.live.
          </p>
        </section>

      </div>
    </div>
  );
}
