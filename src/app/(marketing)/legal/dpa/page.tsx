import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Data Processing Addendum",
  description:
    "LYTEHAUS Technologies Data Processing Addendum — GDPR Art. 28 compliant DPA incorporating EU SCCs and UK IDTA.",
  path: "/legal/dpa",
  noIndex: false,
});

export default function DpaPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Data Processing Addendum</h1>
      <p className="mt-4 text-xs text-[var(--text-muted)]">Last updated: 2026-05-10</p>
      <div className="mt-8 space-y-8 text-sm text-[var(--text-secondary)]">
        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">1. Scope and Applicability</h2>
          <p className="mt-2">
            This Data Processing Addendum (&quot;DPA&quot;) forms part of the Terms of Service between you
            (&quot;Controller&quot;) and LYTEHAUS Technologies (&quot;Processor&quot;). It applies wherever the Processor
            processes personal data on behalf of the Controller in the course of providing the Service, and is required
            by GDPR Art. 28. The DPA auto-applies upon subscription; no counter-signature is required unless your
            procurement policy mandates one (request a counter-signed copy via Settings → Compliance).
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">2. Roles</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              <strong>Controller:</strong> You (the subscribing organisation) — determines the purposes and means of
              processing.
            </li>
            <li>
              <strong>Processor:</strong> LYTEHAUS Technologies — processes personal data solely on your documented
              instructions.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">3. Subject Matter, Duration &amp; Nature</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              <strong>Subject matter:</strong> Processing necessary to provide the ATLVS, GVTEWAY, and COMPVSS modules
              (project management, advancing, ticketing, fabrication ops, field PWA, stakeholder portals, marketplace).
            </li>
            <li>
              <strong>Duration:</strong> For the term of your subscription. Upon termination, data is retained in
              exportable form for 30 days then purged within a further 30 days.
            </li>
            <li>
              <strong>Nature:</strong> Storage, retrieval, display, transformation, and transmission of personal data
              within the platform; AI-assisted analysis where you enable AI features.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">4. Categories of Data Subjects</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Your employees and contractors (crew, staff, project managers).</li>
            <li>Clients, vendors, and talent whose records you manage in the platform.</li>
            <li>Event attendees and guests (ticket-holders, credentialed guests).</li>
            <li>Portal users (stakeholders, sponsors, media) accessing GVTEWAY.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">5. Types of Personal Data</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Identification data: name, email, phone, job title.</li>
            <li>Professional data: role, credentials, certifications, assignments.</li>
            <li>Financial data: payment instructions, expense records, invoice data.</li>
            <li>Location data: event addresses, GPS check-in data (COMPVSS).</li>
            <li>Biometric-adjacent data: photo credentials/wristbands (stored as image files only).</li>
            <li>Communication data: messages, comments, annotations within the platform.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">6. Processor Obligations (GDPR Art. 28(3))</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              <strong>Instructions:</strong> Process only on your documented instructions. If we believe an instruction
              infringes GDPR, we will notify you before processing.
            </li>
            <li>
              <strong>Confidentiality:</strong> Authorised personnel are bound by confidentiality obligations.
            </li>
            <li>
              <strong>Security:</strong> We implement technical and organisational measures appropriate to the risk,
              including encryption at rest and in transit, RLS at the database layer, MFA enforcement, rate limiting,
              and regular penetration testing.
            </li>
            <li>
              <strong>Sub-processors:</strong> We engage sub-processors (listed below) under written contracts
              containing equivalent data protection obligations. We will notify you of intended sub-processor changes
              with 30 days&apos; notice.
            </li>
            <li>
              <strong>Assistance:</strong> We will assist you in responding to data subject rights requests, security
              incidents, DPIAs, and regulatory consultations within commercially reasonable timescales.
            </li>
            <li>
              <strong>Deletion / return:</strong> Upon termination, we will delete or return all personal data and
              delete existing copies unless retention is required by law.
            </li>
            <li>
              <strong>Audits:</strong> We will make available information necessary to demonstrate compliance and allow
              for audits conducted by you or a mandated auditor, subject to reasonable notice and confidentiality
              obligations.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">7. Sub-processors</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Supabase, Inc. (database hosting — EU region available)</li>
            <li>Stripe, Inc. (payment processing)</li>
            <li>Anthropic, PBC (AI assistant features — only activated where you enable AI)</li>
            <li>Vercel, Inc. (edge delivery and CDN)</li>
            <li>Sentry (error monitoring)</li>
            <li>Resend (transactional email)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">8. International Data Transfers</h2>
          <p className="mt-2">
            Where personal data is transferred outside the EEA or UK, the transfer is governed by the EU Standard
            Contractual Clauses (Commission Implementing Decision 2021/914) and the UK IDTA as applicable. Copies are
            available on request at{" "}
            <a href="mailto:privacy@lytehaus.live" className="text-[var(--org-primary)] underline">
              privacy@lytehaus.live
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">9. Breach Notification</h2>
          <p className="mt-2">
            We will notify you of a confirmed personal data breach without undue delay and no later than 48 hours of
            becoming aware, providing sufficient information to allow you to meet your own notification obligations to
            supervisory authorities.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">10. Counter-signed Copy</h2>
          <p className="mt-2">
            If your procurement policy requires a counter-signed DPA, request one via Settings → Compliance or email{" "}
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
