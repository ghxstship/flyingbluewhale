import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Data Processing Addendum",
  description: "LYTEHAUS Technologies Data Processing Addendum incorporating EU SCCs and UK IDTA.",
};

export default function DpaPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Data Processing Addendum</h1>
      <p className="mt-4 text-xs text-[var(--text-muted)]">Last updated: 2026-05-10 · Effective: 2026-05-10</p>

      <div className="mt-8 space-y-8 text-sm text-[var(--text-secondary)]">

        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">1. Scope &amp; Incorporation</h2>
          <p className="mt-2">
            This Data Processing Addendum (&ldquo;DPA&rdquo;) forms part of the LYTEHAUS Technologies
            Terms of Service (&ldquo;Agreement&rdquo;) between LYTEHAUS Technologies (&ldquo;Processor&rdquo;)
            and the Customer (&ldquo;Controller&rdquo;). It applies wherever the Processor processes Personal
            Data on behalf of the Controller in connection with the Service.
          </p>
          <p className="mt-2">
            This DPA auto-applies to all subscribed Customers. A counter-signed PDF copy can be requested
            from Settings → Compliance → Request signed DPA, or by emailing privacy@lytehaus.live.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">2. Definitions</h2>
          <ul className="mt-2 space-y-1 pl-4">
            <li><strong className="text-[var(--foreground)]">&ldquo;Personal Data&rdquo;</strong> — any information that relates to an identified or identifiable natural person within Customer Data.</li>
            <li><strong className="text-[var(--foreground)]">&ldquo;Processing&rdquo;</strong> — any operation or set of operations performed on Personal Data.</li>
            <li><strong className="text-[var(--foreground)]">&ldquo;Controller&rdquo;</strong> — the Customer, who determines the purposes and means of Processing.</li>
            <li><strong className="text-[var(--foreground)]">&ldquo;Processor&rdquo;</strong> — LYTEHAUS Technologies, who Processes Personal Data on behalf of the Controller.</li>
            <li><strong className="text-[var(--foreground)]">&ldquo;Sub-processor&rdquo;</strong> — any third party engaged by the Processor to Process Personal Data.</li>
            <li><strong className="text-[var(--foreground)]">&ldquo;GDPR&rdquo;</strong> — Regulation (EU) 2016/679 (General Data Protection Regulation) and, where applicable, the UK GDPR.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">3. Processing Details</h2>
          <ul className="mt-2 space-y-1 pl-4">
            <li><strong className="text-[var(--foreground)]">Subject matter:</strong> Provision of the LYTEHAUS Technologies platform.</li>
            <li><strong className="text-[var(--foreground)]">Duration:</strong> The term of the Agreement.</li>
            <li><strong className="text-[var(--foreground)]">Nature:</strong> Storage, retrieval, display, transmission, and deletion of Customer Data.</li>
            <li><strong className="text-[var(--foreground)]">Purpose:</strong> Solely to provide the Service as instructed by the Controller.</li>
            <li><strong className="text-[var(--foreground)]">Categories of data subjects:</strong> Controller&apos;s employees, contractors, event crew, artists, vendors, and end-users.</li>
            <li><strong className="text-[var(--foreground)]">Categories of personal data:</strong> Names, work emails, phone numbers, job roles, financial records, and operational event data uploaded by the Controller.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">4. Processor Obligations</h2>
          <p className="mt-2">The Processor agrees to:</p>
          <ul className="mt-2 space-y-1 pl-4">
            <li>Process Personal Data only on documented instructions from the Controller.</li>
            <li>Ensure persons authorized to process the data are bound by confidentiality.</li>
            <li>Implement technical and organizational measures as described in Annex II.</li>
            <li>Assist the Controller in meeting data subject rights obligations.</li>
            <li>Delete or return all Personal Data upon termination as instructed.</li>
            <li>Make available all information necessary to demonstrate compliance and support audits.</li>
            <li>Notify the Controller without undue delay (and no later than 48 hours) of a confirmed Personal Data breach.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">5. Sub-processors</h2>
          <p className="mt-2">
            The Controller grants general authorization for the Processor to engage the following
            sub-processors. The Processor will notify the Controller of any intended changes and give
            the Controller an opportunity to object before the change takes effect.
          </p>
          <ul className="mt-2 space-y-1 pl-4">
            <li><strong className="text-[var(--foreground)]">Supabase Inc.</strong> — US — database infrastructure &amp; authentication.</li>
            <li><strong className="text-[var(--foreground)]">Stripe, Inc.</strong> — US — payment processing.</li>
            <li><strong className="text-[var(--foreground)]">Anthropic, PBC</strong> — US — AI inference (zero-retention API; no training on Customer Data).</li>
            <li><strong className="text-[var(--foreground)]">Vercel Inc.</strong> — US — edge hosting &amp; CDN.</li>
            <li><strong className="text-[var(--foreground)]">Resend</strong> — US — transactional email delivery.</li>
            <li><strong className="text-[var(--foreground)]">Sentry</strong> — US — error monitoring (PII scrubbed before transmission).</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">6. International Data Transfers</h2>
          <p className="mt-2">
            Where Personal Data is transferred from the EEA or UK to a third country (including to
            sub-processors in the United States), the transfer is governed by:
          </p>
          <ul className="mt-2 space-y-1 pl-4">
            <li><strong className="text-[var(--foreground)]">EU SCCs:</strong> Commission Implementing Decision (EU) 2021/914 (Module 2: Controller-to-Processor), incorporated herein by reference.</li>
            <li><strong className="text-[var(--foreground)]">UK IDTA:</strong> The International Data Transfer Addendum issued by the ICO (Version B1.0, March 2022), for transfers from the UK.</li>
            <li><strong className="text-[var(--foreground)]">Swiss nFADP:</strong> Equivalent safeguards for transfers from Switzerland.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">7. Security Measures (Annex II)</h2>
          <ul className="mt-2 space-y-1 pl-4">
            <li>TLS 1.2+ for all data in transit.</li>
            <li>AES-256 encryption at rest (Supabase managed encryption).</li>
            <li>Row-Level Security (RLS) enforced at the database level for all tables.</li>
            <li>Multi-factor authentication available and enforceable by role.</li>
            <li>Full audit logging of all data modifications.</li>
            <li>Penetration testing and security reviews on a quarterly basis.</li>
            <li>Incident response plan with defined escalation procedures.</li>
            <li>Logical separation of customer data by organization ID enforced at every query boundary.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">8. Data Subject Rights</h2>
          <p className="mt-2">
            The Processor will promptly notify the Controller of any data subject requests received
            directly. The Controller is responsible for responding to data subjects. The Processor will
            provide technical assistance (e.g., data export, deletion) as described in Settings →
            Compliance. Deletion requests are executed within 30 days of confirmed instruction.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">9. Governing Law</h2>
          <p className="mt-2">
            This DPA is governed by the laws applicable to the Agreement (State of Florida, USA). Where
            the EU SCCs or UK IDTA conflict with these Terms, the SCCs/IDTA prevail for EEA/UK data transfers.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">10. Contact</h2>
          <p className="mt-2">
            Questions regarding this DPA: privacy@lytehaus.live · dpo@lytehaus.live.
            Counter-signed copies: Settings → Compliance → Request signed DPA.
          </p>
        </section>

      </div>
    </div>
  );
}
