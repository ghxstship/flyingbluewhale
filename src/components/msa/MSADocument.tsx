import type { ReactNode } from "react";
import type { IndependentContractorMsaResolved } from "@/lib/msa/types";
import { formatDate, formatDateTime, formatMoney } from "@/lib/i18n/format";

type Translator = (key: string, vars?: Record<string, string | number>, fallback?: string) => string;

/** Identity translator — used when no `t` is supplied so the English fallbacks render verbatim. */
const identityT: Translator = (_key, _vars, fallback) => fallback ?? "";

/**
 * Independent Contractor Master Services Agreement — branded, print-friendly.
 *
 * Holds the Nevada IC compliance language (Recitals, Relationship of the
 * Parties, T&C, Governing Law, Exhibits B/C). Signed once per crew member;
 * offer letters reference it by link.
 *
 * Body text is sourced from the org's default_terms (or body_snapshot once
 * signed). The static structural sections (Recitals, Relationship, Exhibits)
 * live in this component as they are the same across every MSA.
 */
export function MSADocument({
  msa,
  orgName,
  t = identityT,
}: {
  msa: IndependentContractorMsaResolved;
  orgName: string;
  /** Request translator. Optional — falls back to English literals when omitted (e.g. legacy callers). */
  t?: Translator;
}) {
  const issuedOn = formatDate(msa.created_at, "long");
  const tcBody = msa.body_snapshot ?? "";
  const governingLaw = msa.governing_law_snapshot ?? "State of Nevada";

  return (
    <article className="surface mx-auto max-w-3xl space-y-8 p-10 print:p-0 print:shadow-none">
      <header className="flex items-start justify-between border-b border-[var(--p-border)] pb-6">
        <div>
          <div className="font-mono text-xs tracking-widest text-[var(--p-text-2)] uppercase">{orgName}</div>
          <h1 className="mt-2 text-[length:var(--p-fs-h2)] leading-tight">
            {t("legal.msaDocument.title", undefined, "Independent Contractor Master Services Agreement")}
          </h1>
          <div className="mt-1 text-sm text-[var(--p-text-2)]">
            {t("legal.msaDocument.version", { version: msa.version }, `Version ${msa.version}`)}
          </div>
        </div>
        <div className="text-end text-xs text-[var(--p-text-2)]">
          <div>{t("legal.msaDocument.issued", { date: issuedOn }, `Issued ${issuedOn}`)}</div>
          <div className="font-mono">REF · MSA-{msa.id.slice(0, 8).toUpperCase()}</div>
        </div>
      </header>

      <section className="space-y-2">
        <div className="text-xs tracking-widest text-[var(--p-text-2)] uppercase">
          {t("legal.msaDocument.contractor", undefined, "Contractor")}
        </div>
        <div className="text-base font-medium">{msa.crew_member_name}</div>
        {msa.crew_member_phone && (
          <div className="font-mono text-xs text-[var(--p-text-2)]">{msa.crew_member_phone}</div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold tracking-wider text-[var(--p-text-2)] uppercase">
          {t("legal.msaDocument.recitalsHeading", undefined, "Recitals")}
        </h2>
        <p className="text-sm leading-relaxed">
          This Master Services Agreement (this &ldquo;Agreement&rdquo;) is entered into between{" "}
          <strong>{orgName}</strong> (&ldquo;Company&rdquo;) and the contractor identified above
          (&ldquo;Contractor&rdquo;), effective on the date of acceptance below. Company engages Contractor from time to
          time to provide services on specific experiential productions (each, an &ldquo;Activation&rdquo;), with the
          scope, deliverables, compensation, and schedule of each engagement set out in a separate engagement letter or
          deal memo that references this Agreement. This Agreement governs the relationship between the Parties for all
          such engagements, until revoked or superseded.
        </p>
        <p className="text-xs leading-relaxed text-[var(--p-text-2)]">
          This Agreement is drafted to satisfy NRS 608.0155(1) (the five-criteria conclusive presumption for Nevada
          wage-and-hour purposes) and NRS 608.0155(2) where applicable to Chapter 624 trade scopes; it is aligned with
          the NRS 612.085 ABC test.
        </p>
      </section>

      <section className="break-inside-avoid space-y-3">
        <h2 className="text-sm font-semibold tracking-wider text-[var(--p-text-2)] uppercase">
          {t("legal.msaDocument.relationshipHeading", undefined, "1. Relationship of the Parties")}
        </h2>
        <div className="space-y-3 text-sm leading-relaxed">
          <p>
            <strong>1.1 Independent Contractor Status.</strong> The relationship between Company and Contractor is that
            of independent contractor.{" "}
            <strong>
              Contractor controls and directs, in Contractor&rsquo;s sole discretion, the means, manner, methods,
              sequence, tools, equipment, procedures, and personnel by which the services are performed.
            </strong>{" "}
            Contractor&rsquo;s performance under any specific engagement letter is subject only to (i) the deliverables,
            acceptance criteria, and milestone dates referenced in that engagement letter, (ii) reasonable coordination
            requirements necessary to interface with concurrent Activation operations, and (iii) compliance with venue,
            safety, regulatory, insurance, and event-permitting obligations of general applicability. Contractor is not
            subject to Company&rsquo;s employee handbook, performance review procedures, progressive discipline
            policies, training programs, or other employee directives, and shall not represent itself as Company&rsquo;s
            employee.
          </p>
          <p>
            <strong>1.2 Place of Performance and Course of Business.</strong>{" "}
            <strong>
              All services performed under any engagement letter that references this Agreement shall be performed at
              Contractor&rsquo;s own premises and at the applicable Activation Site, a third-party venue and licensed
              event site that does not constitute a place of business of Company. Company maintains no offices,
              facilities, or places of business at any Activation Site.
            </strong>{" "}
            No services shall be required at any office, facility, studio, warehouse, or other place of business owned,
            leased, occupied, or operated by Company.
          </p>
          <p>
            <strong>1.3 Independently Established Trade.</strong>{" "}
            <strong>
              Contractor represents and warrants that Contractor is engaged in an independently established trade, holds
              Contractor out to the general public as available to perform such services for clients other than Company,
              has performed substantially similar services for at least two (2) other clients within the twenty-four
              (24) months preceding the effective date of this Agreement (as itemized in Exhibit B), and bears the
              economic risk of profit or loss in Contractor&rsquo;s business.
            </strong>
          </p>
          <p>
            <strong>1.4 NRS 608.0155(1)(c) Five-Criteria Representations.</strong> Contractor further represents, in
            satisfaction of NRS 608.0155(1)(c), that <strong>(i)</strong> notwithstanding such control as may be
            necessary to comply with statutory, regulatory, or contractual obligations, Contractor has sole control and
            discretion over the means and manner of the performance of the services and the result of the work;{" "}
            <strong>(ii)</strong> Contractor has control over the time during which the services are performed, subject
            only to the milestone dates in the applicable engagement letter; <strong>(iii)</strong> Contractor is not
            required to work exclusively for Company and is free to engage with other principals; <strong>(iv)</strong>{" "}
            Contractor is free to engage, at Contractor&rsquo;s own expense, employees, subcontractors, or assistants to
            perform any portion of the services; and <strong>(v)</strong> Contractor contributes a substantial
            investment of capital in Contractor&rsquo;s business, as itemized in Exhibit C.
          </p>
        </div>
      </section>

      {tcBody && (
        <section className="break-inside-avoid space-y-3">
          <h2 className="text-sm font-semibold tracking-wider text-[var(--p-text-2)] uppercase">
            {t("legal.msaDocument.termsHeading", undefined, "2. Terms & Conditions")}
          </h2>
          <div className="space-y-3 text-sm leading-relaxed">
            {tcBody.split(/\n\n+/).map((para, i) => (
              <p key={i}>{renderInlineBold(para)}</p>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold tracking-wider text-[var(--p-text-2)] uppercase">
          {t("legal.msaDocument.governingLawHeading", undefined, "3. Governing Law & Confidentiality")}
        </h2>
        <p className="text-sm leading-relaxed">
          This Agreement is governed by the laws of the <strong>{governingLaw}</strong>, without regard to its
          conflict-of-laws principles. Venue lies in the state and federal courts of{" "}
          <strong>Clark County, Nevada</strong>. The terms of this Agreement and of any engagement letter that
          references it are confidential and proprietary to {orgName}; Contractor agrees not to disclose, reproduce, or
          share any portion thereof, except with Contractor&rsquo;s legal, tax, or financial counsel acting on
          Contractor&rsquo;s behalf and bound by professional confidentiality obligations. This obligation survives the
          conclusion of any engagement.
        </p>
      </section>

      <section className="break-inside-avoid space-y-3 border-t border-[var(--p-border)] pt-6">
        <h2 className="text-sm font-semibold tracking-wider text-[var(--p-text-2)] uppercase">
          {t("legal.msaDocument.exhibitBHeading", undefined, "Exhibit B: Other Clients")}
        </h2>
        <p className="text-xs text-[var(--p-text-2)]">
          {t(
            "legal.msaDocument.exhibitBHint",
            undefined,
            "Contractor represents that Contractor has performed substantially similar services for the following clients within the twenty-four (24) months preceding the effective date of this Agreement.",
          )}
        </p>
        <ExhibitTable
          rows={msa.exhibit_b_other_clients}
          fallbackRows={3}
          columns={[
            { key: "client", label: t("legal.msaDocument.colClient", undefined, "Client") },
            { key: "project", label: t("legal.msaDocument.colProject", undefined, "Project") },
            { key: "dates", label: t("legal.msaDocument.colDates", undefined, "Dates") },
          ]}
        />
      </section>

      <section className="break-inside-avoid space-y-3">
        <h2 className="text-sm font-semibold tracking-wider text-[var(--p-text-2)] uppercase">
          {t("legal.msaDocument.exhibitCHeading", undefined, "Exhibit C: Capital Investment Itemization")}
        </h2>
        <p className="text-xs text-[var(--p-text-2)]">
          {t(
            "legal.msaDocument.exhibitCHint",
            undefined,
            "Contractor's capital investment in Contractor's business relevant to the services may include, without limitation, business entity formation, insurance carried, software/equipment/tools owned, pre-engagement preparation and certifications, and trade-specific NSCB licensure where applicable.",
          )}
        </p>
        <ExhibitTable
          rows={msa.exhibit_c_capital_items}
          fallbackRows={4}
          columns={[
            { key: "label", label: t("legal.msaDocument.colItemCategory", undefined, "Item / Category") },
            { key: "description", label: t("legal.msaDocument.colDescriptionValue", undefined, "Description / Value") },
          ]}
        />
        {(msa.nscb_license_number || msa.nscb_classification) && (
          <div className="mt-2 rounded border border-[var(--p-border)] bg-[var(--p-surface-2)] p-3 text-xs leading-relaxed">
            <div className="mb-1 font-medium tracking-wider text-[var(--p-text-2)] uppercase">
              {t("legal.msaDocument.nscbLicenseHeading", undefined, "NSCB License · Chapter 624")}
            </div>
            <div>
              {t("legal.msaDocument.licenseNumberLabel", undefined, "License #:")}{" "}
              <strong>{msa.nscb_license_number ?? "—"}</strong> ·{" "}
              {t("legal.msaDocument.classificationLabel", undefined, "Classification:")}{" "}
              <strong>{msa.nscb_classification ?? "—"}</strong>
              {msa.nscb_monetary_limit_cents != null && (
                <>
                  {` · ${t("legal.msaDocument.monetaryLimitLabel", undefined, "Monetary Limit:")} `}
                  <strong>{formatMoney(msa.nscb_monetary_limit_cents, { fractionDigits: 0 })}</strong>
                </>
              )}
            </div>
          </div>
        )}
      </section>

      <section className="border-t border-[var(--p-border)] pt-6">
        {msa.msa_state === "signed" && msa.signed_signature ? (
          <div className="space-y-2">
            <div className="text-xs tracking-widest text-[var(--p-text-2)] uppercase">
              {t("legal.msaDocument.signed", undefined, "Signed")}
            </div>
            <div className="font-subdisplay text-2xl tracking-wide">{msa.signed_signature}</div>
            <div className="text-xs text-[var(--p-text-2)]">
              {t(
                "legal.msaDocument.counterSigned",
                { when: msa.signed_at ? formatDateTime(msa.signed_at) : "" },
                `Counter-signed ${msa.signed_at ? formatDateTime(msa.signed_at) : ""}`,
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-2 text-sm text-[var(--p-text-2)]">
            <div className="text-xs tracking-widest uppercase">
              {t("legal.msaDocument.awaitingCounterSignature", undefined, "Awaiting Counter-Signature")}
            </div>
            <div>
              {t(
                "legal.msaDocument.awaitingBody",
                undefined,
                "Type your full legal name to formalize acceptance of this Master Services Agreement. Your typed signature, IP address, and timestamp will be captured as the audit trail.",
              )}
            </div>
          </div>
        )}
        <div className="mt-6 grid grid-cols-2 gap-6 text-xs text-[var(--p-text-2)]">
          <div>
            <div className="font-medium text-[var(--p-text-2)]">
              {t("legal.msaDocument.forOrg", { org: orgName }, `For ${orgName}`)}
            </div>
            <div className="font-subdisplay text-lg tracking-wide">Julian Clarkson</div>
            <div>{t("legal.msaDocument.signerTitle", undefined, "Producer & Operations Director")}</div>
          </div>
          <div className="text-end">
            <div>{t("legal.msaDocument.reference", undefined, "Reference")}</div>
            <div className="font-mono">MSA-{msa.id.slice(0, 8).toUpperCase()}</div>
          </div>
        </div>
      </section>
    </article>
  );
}

type ExhibitColumn = { key: string; label: string };

function ExhibitTable({
  rows,
  fallbackRows,
  columns,
}: {
  rows: Array<Record<string, string>>;
  fallbackRows: number;
  columns: ExhibitColumn[];
}) {
  const display =
    rows.length > 0 ? rows : Array.from({ length: fallbackRows }).map(() => ({}) as Record<string, string>);
  return (
    <div className="overflow-hidden rounded border border-[var(--p-border)]">
      <table className="w-full text-xs">
        <thead className="bg-[var(--p-surface-2)] text-[var(--p-text-2)]">
          <tr>
            {columns.map((c) => (
              <th key={c.key} className="px-3 py-2 text-start font-medium tracking-wider uppercase">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {display.map((row, i) => (
            <tr key={i} className="border-t border-[var(--p-border)]">
              {columns.map((c) => {
                const v = row[c.key];
                return (
                  <td key={c.key} className="px-3 py-3">
                    {v ? (
                      <span className="text-sm">{v}</span>
                    ) : (
                      <div className="h-4 border-b border-dashed border-[var(--p-border)]" />
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function renderInlineBold(text: string): ReactNode[] {
  return text
    .split(/\*\*/)
    .map((part, i) => (i % 2 === 1 ? <strong key={i}>{part}</strong> : <span key={i}>{part}</span>));
}
