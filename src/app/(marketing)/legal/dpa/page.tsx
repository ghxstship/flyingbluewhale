import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Data Processing Addendum",
  description: "Data Processing Addendum between FLYTEHAUS Technologies (Processor) and Customers (Controller).",
};

export default function DpaPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Data Processing Addendum</h1>
      <p className="mt-4 text-xs text-[var(--text-muted)]">
        Version 1.0 · Last updated: 2026-04-16 · Effective on subscription activation
      </p>

      <div className="mt-8 space-y-8 text-sm text-[var(--text-secondary)]">
        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">1. Scope and Application</h2>
          <p className="mt-2">
            This Data Processing Addendum ("DPA") supplements the FLYTEHAUS Technologies Terms of Service and governs
            all processing of Personal Data by FLYTEHAUS Technologies ("Processor") on behalf of the Customer
            ("Controller") in connection with the Service. This DPA auto-applies when a Customer subscribes to any paid
            tier. A counter-signed copy is available on request from Settings → Compliance → Request Signed DPA.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">2. Definitions</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              <strong>"Personal Data"</strong> has the meaning given in the GDPR (Regulation (EU) 2016/679) and
              equivalent applicable law.
            </li>
            <li>
              <strong>"Processing"</strong> means any operation performed on Personal Data, including storage,
              retrieval, transmission, and deletion.
            </li>
            <li>
              <strong>"Sub-processor"</strong> means any third party engaged by the Processor to process Personal Data
              on behalf of the Controller.
            </li>
            <li>
              <strong>"SCCs"</strong> means the Standard Contractual Clauses for the transfer of personal data to third
              countries pursuant to Regulation (EU) 2016/679 (Commission Implementing Decision (EU) 2021/914, Module 2:
              Controller to Processor).
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">3. Roles</h2>
          <p className="mt-2">
            The Controller determines the purposes and means of processing Personal Data uploaded to or generated within
            the Service. The Processor processes Personal Data solely on the documented instructions of the Controller.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">4. Subject Matter, Duration, and Nature</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              <strong>Subject matter:</strong> Operation of the ATLVS, GVTEWAY, and COMPVSS platforms, including
              storage, retrieval, and transmission of Customer workspace data.
            </li>
            <li>
              <strong>Duration:</strong> For the term of the Customer's subscription, plus up to 30 days following
              termination (backup purge window).
            </li>
            <li>
              <strong>Nature of processing:</strong> Collection, storage, retrieval, structuring, transmission,
              erasure, and pseudonymisation of Personal Data as required to deliver the Service.
            </li>
            <li>
              <strong>Categories of data subjects:</strong> The Controller's employees, contractors, clients,
              event-crew members, and other individuals whose data the Controller uploads to the Service.
            </li>
            <li>
              <strong>Categories of personal data:</strong> Names, email addresses, phone numbers, roles/titles,
              financial records, schedule and attendance data, credential documents, location data (where the
              Controller enables clock-in features), and any other data the Controller elects to store.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">5. Processor Obligations</h2>
          <p className="mt-2">The Processor shall:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Process Personal Data only on documented instructions from the Controller.</li>
            <li>
              Ensure all personnel authorised to process Personal Data are bound by confidentiality obligations.
            </li>
            <li>Implement and maintain the technical and organisational security measures described in Section 8.</li>
            <li>
              Not engage new sub-processors without providing the Controller at least 14 days' prior notice and the
              opportunity to object.
            </li>
            <li>
              Assist the Controller, by appropriate technical and organisational measures, in fulfilling its obligations
              to respond to data subject requests under applicable law.
            </li>
            <li>
              Notify the Controller without undue delay (and no later than 48 hours after becoming aware) of a Personal
              Data breach affecting Controller data.
            </li>
            <li>
              Delete or return all Personal Data upon termination of the Service and delete existing copies, unless
              required to retain them by applicable law.
            </li>
            <li>
              Provide all information necessary to demonstrate compliance with this DPA and allow for audits or
              inspections upon reasonable notice.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">6. Sub-processors</h2>
          <p className="mt-2">
            The Controller provides general authorisation for the Processor to engage the following sub-processors.
            The Processor will maintain an up-to-date list at{" "}
            <a href="/legal/subprocessors" className="underline underline-offset-2">
              flytehaus.studio/legal/subprocessors
            </a>{" "}
            and notify the Controller of any changes with at least 14 days' notice.
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Supabase Inc. — database and authentication (USA)</li>
            <li>Vercel Inc. — hosting and CDN (global)</li>
            <li>Stripe Inc. — payment processing (USA)</li>
            <li>Anthropic PBC — AI inference (USA)</li>
            <li>Functional Software, Inc. (Sentry) — error monitoring (USA)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">7. International Data Transfers</h2>
          <p className="mt-2">
            Where the Processor transfers Personal Data from the EEA or UK to a country without an adequacy decision,
            the transfer is governed by the applicable EU SCCs (Module 2: Controller to Processor) or, for UK transfers,
            the UK IDTA, which are incorporated by reference. The Parties agree to execute the SCCs / IDTA to the extent
            required by applicable law; signed copies are available on request.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">8. Technical and Organisational Measures</h2>
          <p className="mt-2">
            The Processor maintains the following measures, reviewed at least annually:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Encryption of Personal Data in transit (TLS 1.2+) and at rest (AES-256).</li>
            <li>Role-based access control and row-level security enforced at the database layer.</li>
            <li>Multi-factor authentication required for all Processor administrative access.</li>
            <li>Automated vulnerability scanning and dependency audits.</li>
            <li>Incident response procedures with a defined 48-hour breach notification SLA.</li>
            <li>Regular backups with point-in-time recovery.</li>
            <li>Logical separation of customer data by organisation (org_id scoping).</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">9. Governing Law</h2>
          <p className="mt-2">
            This DPA is governed by the law of the State of Nevada, USA, except to the extent that applicable EU or UK
            data protection law requires a different governing law for specific provisions.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">10. Contact</h2>
          <p className="mt-2">
            Data protection enquiries:{" "}
            <a href="mailto:privacy@flytehaus.studio" className="underline underline-offset-2">
              privacy@flytehaus.studio
            </a>
            . To request a counter-signed copy of this DPA, go to Settings → Compliance → Request Signed DPA.
          </p>
        </section>
      </div>
    </div>
  );
}
