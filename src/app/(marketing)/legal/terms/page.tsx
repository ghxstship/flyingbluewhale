import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms governing your use of FLYTEHAUS Technologies — ATLVS, GVTEWAY, and COMPVSS.",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Terms of Service</h1>
      <p className="mt-4 text-xs text-[var(--text-muted)]">Last updated: 2026-04-16 · Effective: 2026-04-16</p>

      <div className="mt-8 space-y-8 text-sm text-[var(--text-secondary)]">
        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">1. Acceptance of Terms</h2>
          <p className="mt-2">
            By accessing or using the FLYTEHAUS Technologies platform (including ATLVS, GVTEWAY, and COMPVSS,
            collectively the "Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree,
            you must not access or use the Service. These Terms form a binding agreement between you (or the entity you
            represent, "Customer") and FLYTEHAUS Technologies ("Company", "we", "us").
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">2. Accounts and Access</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>You must provide accurate, complete information when creating an account.</li>
            <li>
              You are responsible for safeguarding your credentials and for all activity that occurs under your account.
              Notify us immediately at{" "}
              <a href="mailto:security@flytehaus.studio" className="underline underline-offset-2">
                security@flytehaus.studio
              </a>{" "}
              if you suspect unauthorised access.
            </li>
            <li>You may not share account credentials with others or create accounts by automated means.</li>
            <li>We may suspend accounts that violate these Terms or that we reasonably suspect are compromised.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">3. Acceptable Use</h2>
          <p className="mt-2">You agree not to:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Use the Service for any unlawful purpose or in violation of applicable laws or regulations.</li>
            <li>
              Upload, store, or transmit content that is illegal, defamatory, harassing, or infringes third-party
              intellectual property rights.
            </li>
            <li>
              Attempt to probe, scan, or test the vulnerability of the Service or circumvent any security measures.
            </li>
            <li>
              Reverse-engineer, decompile, or disassemble any part of the Service (except where expressly permitted by
              law).
            </li>
            <li>
              Use the Service to transmit spam, malware, or any unsolicited bulk communications.
            </li>
            <li>
              Resell, sublicense, or otherwise make the Service available to third parties except as expressly permitted
              by your subscription tier.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">4. Subscription and Billing</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Paid plans are billed in advance on a monthly or annual cycle through Stripe.</li>
            <li>
              All fees are exclusive of applicable taxes (VAT, GST, sales tax), which will be added where required by
              law.
            </li>
            <li>
              You authorise us to charge your payment method on file for all recurring fees. It is your responsibility to
              keep billing details current.
            </li>
            <li>
              Subscriptions auto-renew unless cancelled at least 24 hours before the renewal date via Settings →
              Billing.
            </li>
            <li>
              We do not offer refunds for partial billing periods except where required by applicable consumer
              protection law.
            </li>
            <li>
              We may update pricing with at least 30 days' notice. Continued use after the effective date constitutes
              acceptance.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">5. Data Ownership and Portability</h2>
          <p className="mt-2">
            You own all content and data you upload to the Service. We process it solely to provide the Service and as
            described in our Privacy Policy. You may export your data at any time from Settings → Compliance → Export
            Data. Upon termination, exported data remains available for 30 days, after which it is deleted per our
            retention policy.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">6. Intellectual Property</h2>
          <p className="mt-2">
            We retain all right, title, and interest in the Service, including all software, designs, trademarks, and
            documentation. You are granted a limited, non-exclusive, non-transferable licence to access and use the
            Service during the term of your subscription for your internal business purposes. Nothing in these Terms
            transfers any ownership to you.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">7. Confidentiality</h2>
          <p className="mt-2">
            Each party agrees to keep confidential the other party's non-public business information disclosed in
            connection with the Service ("Confidential Information") and to use it only for the purposes permitted under
            these Terms. This obligation does not apply to information that is publicly known, independently developed,
            or required to be disclosed by law.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">8. Disclaimer of Warranties</h2>
          <p className="mt-2">
            THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR
            IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, OR
            UNINTERRUPTED OPERATION. WE DO NOT WARRANT THAT THE SERVICE WILL BE ERROR-FREE OR THAT ANY DEFECTS WILL BE
            CORRECTED.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">9. Limitation of Liability</h2>
          <p className="mt-2">
            TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL FLYTEHAUS TECHNOLOGIES, ITS
            OFFICERS, DIRECTORS, EMPLOYEES, OR LICENSORS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL,
            OR EXEMPLARY DAMAGES (INCLUDING LOSS OF PROFITS, DATA, OR GOODWILL) ARISING OUT OF OR RELATED TO THESE
            TERMS OR YOUR USE OF THE SERVICE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
          </p>
          <p className="mt-2">
            OUR TOTAL AGGREGATE LIABILITY FOR ANY CLAIMS ARISING UNDER THESE TERMS WILL NOT EXCEED THE GREATER OF (A)
            THE FEES PAID BY YOU IN THE 12 MONTHS PRECEDING THE CLAIM, OR (B) USD 100.
          </p>
          <p className="mt-2">
            Some jurisdictions do not permit the exclusion or limitation of certain warranties or liabilities. In those
            jurisdictions, the above limitations apply to the maximum extent permitted by law.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">10. Indemnification</h2>
          <p className="mt-2">
            You agree to indemnify, defend, and hold harmless FLYTEHAUS Technologies and its affiliates from and against
            any claims, damages, losses, and expenses (including reasonable attorneys' fees) arising out of your use of
            the Service, your violation of these Terms, or your infringement of any third-party rights.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">11. Termination</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Either party may terminate these Terms at any time by cancelling the subscription.</li>
            <li>
              We may immediately suspend or terminate your access if you breach these Terms or we are required to do
              so by law.
            </li>
            <li>
              Upon termination, your right to access the Service ceases. Sections 5, 6, 8, 9, 10, 12, and 13 survive
              termination.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">12. Governing Law and Dispute Resolution</h2>
          <p className="mt-2">
            These Terms are governed by the laws of the State of Nevada, USA, without regard to conflict-of-law
            principles. Any dispute arising under or relating to these Terms shall first be submitted to good-faith
            negotiation between the parties. If unresolved within 30 days, the dispute shall be resolved by binding
            arbitration administered by JAMS in Clark County, Nevada, under its Streamlined Arbitration Rules. Either
            party may seek injunctive or other equitable relief in any court of competent jurisdiction. YOU WAIVE ANY
            RIGHT TO A CLASS ACTION OR JURY TRIAL.
          </p>
          <p className="mt-2">
            Customers located in the European Union or United Kingdom may also submit complaints to the relevant
            national consumer protection authority or, for data protection matters, to their local supervisory authority.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">13. General</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              <strong>Entire agreement.</strong> These Terms, the Privacy Policy, the DPA (where applicable), and any
              order form constitute the entire agreement between the parties regarding the Service.
            </li>
            <li>
              <strong>Severability.</strong> If any provision is found unenforceable, the remaining provisions remain
              in full force.
            </li>
            <li>
              <strong>Waiver.</strong> Failure to enforce any provision does not constitute a waiver.
            </li>
            <li>
              <strong>Assignment.</strong> You may not assign these Terms without our prior written consent. We may
              assign these Terms in connection with a merger, acquisition, or sale of assets.
            </li>
            <li>
              <strong>Updates.</strong> We will notify you of material changes at least 14 days before they take effect
              via email or in-app notice. Continued use constitutes acceptance.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">14. Contact</h2>
          <p className="mt-2">
            Legal enquiries:{" "}
            <a href="mailto:legal@flytehaus.studio" className="underline underline-offset-2">
              legal@flytehaus.studio
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
