import type { ReactNode } from "react";
import type { OfferLetterResolved } from "@/lib/offer-letters/types";
import {
  EMPLOYER_LABEL,
  CLASSIFICATION_LABEL,
  BASIS_LABEL,
  TIER_LABEL,
  tierForRoleSlug,
  isChapter624Trade,
} from "@/lib/offer-letters/types";
import { formatCompensation, formatPerDiem } from "@/lib/offer-letters/format";
import { formatDate, formatDateTime } from "@/lib/i18n/format";

/**
 * Branded, print-friendly engagement letter. Reads exclusively from the
 * resolved view shape (or the frozen snapshot) — every value is SSOT-resolved.
 *
 * The doc renders with the baseline locale because letters are part of an
 * audit-grade artifact: switching the rendered date format per viewer would
 * break the contract record. For viewer-aware previews, callers should
 * format dates upstream and pass strings in.
 */
export function LetterDocument({ letter }: { letter: OfferLetterResolved }) {
  const issuedOn = formatDate(letter.created_at, "long");
  const venueLine = [letter.venue_name, letter.venue_city, letter.venue_region].filter(Boolean).join(" · ");
  const tier = tierForRoleSlug(letter.role_slug);
  const isHighRisk = tier === "tier_3_trade" || tier === "tier_4_high_risk";
  const isChapter624 = isChapter624Trade(letter.role_slug);
  const venueJurisdiction =
    [letter.venue_city, letter.venue_region].filter(Boolean).join(", ") || "Clark County, Nevada";

  return (
    <article className="surface mx-auto max-w-3xl space-y-8 p-10 print:p-0 print:shadow-none">
      <header className="flex items-start justify-between border-b border-[var(--border-default)] pb-6">
        <div>
          <div className="font-mono text-xs tracking-widest text-[var(--text-muted)] uppercase">
            {EMPLOYER_LABEL[letter.employer]}
          </div>
          <h1 className="mt-2 text-2xl leading-tight font-semibold">Engagement Letter</h1>
          <div className="mt-1 text-sm text-[var(--text-muted)]">{letter.project_name}</div>
        </div>
        <div className="text-end text-xs text-[var(--text-muted)]">
          <div>Issued {issuedOn}</div>
          <div className="font-mono">REF · OL-{letter.id.slice(0, 8).toUpperCase()}</div>
        </div>
      </header>

      <section className="space-y-2">
        <div className="text-xs tracking-widest text-[var(--text-muted)] uppercase">Recipient</div>
        <div className="text-base font-medium">{letter.recipient_name}</div>
        {letter.recipient_phone && (
          <div className="font-mono text-xs text-[var(--text-muted)]">{letter.recipient_phone}</div>
        )}
      </section>

      <section className="space-y-3">
        <p className="text-sm leading-relaxed">
          Greetings <strong>{letter.recipient_name.split(" ")[0]}</strong>,
        </p>
        <p className="text-sm leading-relaxed">
          You&rsquo;re on the manifest. On behalf of {EMPLOYER_LABEL[letter.employer]}, we&rsquo;re pleased to bring you
          on as <strong>{letter.role_title}</strong> for <strong>{letter.project_name}</strong>. Full engagement details
          are outlined below — please give it a read, then counter-sign at the bottom to make it official.
        </p>
        {letter.signing_authority_name && letter.signing_authority_email && (
          <p className="text-xs text-[var(--text-muted)]">
            Questions before signing? Reach{" "}
            <strong className="text-[var(--text-secondary)]">{letter.signing_authority_name}</strong> at{" "}
            <a className="text-[var(--org-primary)] hover:underline" href={`mailto:${letter.signing_authority_email}`}>
              {letter.signing_authority_email}
            </a>
            .
          </p>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold tracking-wider text-[var(--text-secondary)] uppercase">Recitals</h2>
        <p className="text-sm leading-relaxed">
          This engagement letter (the &ldquo;Agreement&rdquo;) is entered into between{" "}
          <strong>{EMPLOYER_LABEL[letter.employer]}</strong> (&ldquo;Company&rdquo;) and the contractor identified above
          (&ldquo;Contractor&rdquo;), effective on the date of acceptance below. Company is producing the{" "}
          <strong>{letter.project_name}</strong> activation at <strong>{venueLine || venueJurisdiction}</strong> (the
          &ldquo;Activation&rdquo;). Company engages Contractor to provide the services described herein as an
          independent contractor; Contractor accepts that engagement on the terms set forth below.
        </p>
        <p className="text-xs leading-relaxed text-[var(--text-muted)]">
          This Agreement is drafted to satisfy NRS 608.0155(1) — the five-criteria conclusive presumption for Nevada
          wage-and-hour purposes
          {isChapter624 ? " — and NRS 608.0155(2) for Chapter 624 trade scopes" : ""} — and is aligned with the NRS
          612.085 ABC test.
        </p>
        {isHighRisk && (
          <div className="rounded border border-[var(--border-default)] bg-[var(--surface-inset)] p-3 text-xs leading-relaxed">
            <div className="mb-1 font-medium tracking-wider text-[var(--text-secondary)] uppercase">
              Eligibility Prerequisite — {TIER_LABEL[tier]}
            </div>
            <p>
              Execution of this Agreement as an independent contractor engagement is conditioned on Contractor operating
              an established practice with the documentation required by <strong>Exhibits B and C</strong> (Other
              Clients; Capital Investment). Where Contractor does not meet this threshold, the role shall be filled by
              (i) a short-term W-2 employee under a separate offer letter, or (ii) a worker engaged as the W-2 employee
              of a Nevada licensed staffing vendor that bills Company on a labor-services-vendor invoice.
            </p>
            {isChapter624 && (
              <p className="mt-2">
                <strong>Chapter 624 routing.</strong> Where this scope falls within NRS Chapter 624 jurisdiction and
                combined labor and materials exceeds $1,000, Contractor shall be (i) an NSCB licensee in the relevant
                classification with license number, classification, and monetary limit recorded on Exhibit C; or (ii)
                directly compensated by an NSCB licensee acting as prime for the relevant scope.
              </p>
            )}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold tracking-wider text-[var(--text-secondary)] uppercase">
          1. Engagement Summary
        </h2>
        <DefinitionList
          rows={[
            ["Role", letter.role_title],
            ["Department", letter.role_department || "—"],
            ["Classification", CLASSIFICATION_LABEL[letter.classification]],
            [
              "Reports To",
              letter.reports_to_name
                ? `${letter.reports_to_name}${letter.reports_to_role ? ` · ${letter.reports_to_role}` : ""}`
                : "—",
            ],
            ["Work Location", venueLine || "—"],
          ]}
        />

        <div className="mt-4 space-y-2">
          <div className="text-xs tracking-wider text-[var(--text-muted)] uppercase">Engagement Window</div>
          <div className="overflow-hidden rounded border border-[var(--border-default)]">
            <table className="w-full text-xs">
              <tbody>
                <EngagementRow label="Travel In" date={letter.travel_in_date} />
                <EngagementRow
                  label="On Site Start"
                  date={letter.effective_onsite_start ?? letter.onsite_start_date}
                  bold
                />
                <EngagementRow label="On Site End" date={letter.effective_onsite_end ?? letter.onsite_end_date} bold />
                <EngagementRow label="Travel Out" date={letter.travel_out_date} />
              </tbody>
            </table>
          </div>
          {letter.engagement_days > 0 && (
            <div className="text-xs text-[var(--text-muted)]">
              <strong className="text-[var(--text-primary)]">{letter.engagement_days}</strong> projected service day
              {letter.engagement_days === 1 ? "" : "s"} on site. Each documented service day is a discrete deliverable
              referenced in §5; compensation is earned per accepted deliverable, not as wages.
            </div>
          )}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold tracking-wider text-[var(--text-secondary)] uppercase">2. Compensation</h2>
        <DefinitionList
          rows={[
            ["Basis", BASIS_LABEL[letter.compensation_basis]],
            ["Compensation", formatCompensation(letter)],
            ["Travel + Lodging Reimbursement", formatPerDiem(letter.effective_per_diem_cents)],
            ["Payment Schedule", letter.effective_payment_schedule],
          ]}
        />
        <p className="text-xs leading-relaxed text-[var(--text-muted)]">
          Compensation is a per-deliverable fee earned upon Company&rsquo;s acceptance of the corresponding service-day
          deliverable in §5. No overtime, minimum-call, meal-break premium, or per-diem-labeled-as-such applies.
          Contractor is responsible for self-employment tax and all other taxes on amounts paid hereunder.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold tracking-wider text-[var(--text-secondary)] uppercase">3. Inclusions</h2>
        <ul className="space-y-1 text-sm">
          {(letter.effective_inclusions ?? []).length === 0 && (
            <li className="text-[var(--text-muted)]">No additional inclusions specified.</li>
          )}
          {(letter.effective_inclusions ?? []).map((item, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-[var(--text-muted)]">·</span>
              <span>{item}</span>
            </li>
          ))}
          {letter.effective_travel_provided && (
            <li className="flex gap-2">
              <span className="text-[var(--text-muted)]">·</span>
              <span>Travel provided / arranged</span>
            </li>
          )}
          {letter.effective_lodging_provided && (
            <li className="flex gap-2">
              <span className="text-[var(--text-muted)]">·</span>
              <span>Lodging provided</span>
            </li>
          )}
          {letter.effective_meals_provided && (
            <li className="flex gap-2">
              <span className="text-[var(--text-muted)]">·</span>
              <span>Crew meals on call days</span>
            </li>
          )}
        </ul>
        {letter.effective_inclusions_footnote && (
          <p className="text-xs text-[var(--text-muted)] italic">{letter.effective_inclusions_footnote}</p>
        )}
      </section>

      {letter.effective_expectations && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold tracking-wider text-[var(--text-secondary)] uppercase">
            4. Expectations
          </h2>
          <p className="text-sm leading-relaxed whitespace-pre-line">{letter.effective_expectations}</p>
        </section>
      )}

      {(letter.schedule_items?.length ?? 0) > 0 && (
        <section className="break-inside-avoid space-y-3">
          <h2 className="text-sm font-semibold tracking-wider text-[var(--text-secondary)] uppercase">
            5. Working Schedule
          </h2>
          <p className="text-xs text-[var(--text-muted)]">
            Project production schedule milestones (Exhibit A). Dates and activities are subject to revision based on
            production circumstances; Contractor will be notified of material changes through standard production
            channels prior to the affected service day.
          </p>
          <div className="overflow-hidden rounded border border-[var(--border-default)]">
            <table className="w-full text-xs">
              <thead className="bg-[var(--surface-inset)] text-[var(--text-muted)]">
                <tr>
                  <th className="px-3 py-2 text-start font-medium tracking-wider uppercase">Date</th>
                  <th className="px-3 py-2 text-start font-medium tracking-wider uppercase">Call</th>
                  <th className="px-3 py-2 text-start font-medium tracking-wider uppercase">Wrap</th>
                  <th className="px-3 py-2 text-start font-medium tracking-wider uppercase">Milestones</th>
                </tr>
              </thead>
              <tbody>
                {letter.schedule_items.map((d, i) => (
                  <tr key={i} className="border-t border-[var(--border-default)] align-top">
                    <td className="px-3 py-2">
                      <div className="font-medium">{d.day_label}</div>
                      <div className="font-mono text-[10px] text-[var(--text-muted)]">{d.date}</div>
                    </td>
                    <td className="px-3 py-2 font-mono">{d.call_time}</td>
                    <td className="px-3 py-2 font-mono">{d.wrap_time}</td>
                    <td className="px-3 py-2">
                      <ul className="space-y-0.5">
                        {(d.activities ?? []).map((a, j) => (
                          <li key={j}>• {a}</li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {(letter.effective_onboarding_items?.length ?? 0) > 0 && (
        <section className="break-inside-avoid space-y-3">
          <h2 className="text-sm font-semibold tracking-wider text-[var(--text-secondary)] uppercase">
            6. Onboarding Checklist
          </h2>
          <p className="text-xs text-[var(--text-muted)]">
            Please complete each item below within 48 hours of acceptance. Production credentials will not be issued
            until every required item is closed.
          </p>
          <ol className="space-y-2 text-sm">
            {(() => {
              const items = (letter.effective_onboarding_items ?? [])
                .slice()
                .sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
              const guideStep = letter.guide_url
                ? {
                    key: "production_guide",
                    label: "Review the Salvage City Production Guide",
                    required: true,
                    order: (items[items.length - 1]?.order ?? items.length) + 1,
                    link: letter.guide_url,
                  }
                : null;
              const all = guideStep ? [...items, guideStep] : items;
              return all.map((item) => (
                <li key={item.key} className="flex items-baseline gap-3">
                  <span
                    aria-hidden
                    className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded border border-[var(--border-default)] text-[10px]"
                  >
                    {item.order}
                  </span>
                  <span className="flex-1">
                    <span className="block">
                      {item.label}
                      {(item.links?.length ?? 0) > 0
                        ? item.links!.map((l, i) => (
                            <a
                              key={i}
                              href={l.url}
                              className="ms-2 text-[10px] tracking-wider text-[var(--org-primary)] uppercase hover:underline"
                              target="_blank"
                              rel="noreferrer"
                            >
                              {l.label} ↗
                            </a>
                          ))
                        : item.link && (
                            <a
                              href={item.link}
                              className="ms-2 text-[10px] tracking-wider text-[var(--org-primary)] uppercase hover:underline"
                              target="_blank"
                              rel="noreferrer"
                            >
                              Open ↗
                            </a>
                          )}
                    </span>
                    {item.note && <span className="mt-0.5 block text-xs text-[var(--text-muted)]">{item.note}</span>}
                  </span>
                </li>
              ));
            })()}
          </ol>
          <div className="mt-4 space-y-2 rounded border border-[var(--border-default)] bg-[var(--surface-inset)] p-4 text-xs leading-relaxed">
            <div className="font-medium tracking-wider text-[var(--text-secondary)] uppercase">
              Conditions Precedent to Payment
            </div>
            <p>As conditions precedent to Company&rsquo;s obligation to make any payment, Contractor shall deliver:</p>
            <ol className="ms-4 list-decimal space-y-1">
              <li>Executed IRS Form W-9 (EIN preferred).</li>
              <li>
                Evidence of an active <strong>Nevada State Business License</strong> under NRS Chapter 76, or
                registration as a foreign entity authorized to transact business in Nevada.
              </li>
              <li>
                A Certificate of Insurance evidencing (i) commercial general liability of not less than{" "}
                <strong>$1,000,000 per occurrence / $2,000,000 aggregate</strong>, naming Company, the Activation Site
                venue, and Insomniac / EDC LV as additional insureds; (ii) automobile liability if applicable; and (iii)
                Nevada workers&rsquo; compensation coverage under NRS Chapter 616B, or a duly executed sole-proprietor
                waiver.
              </li>
              <li>
                Executed <strong>Exhibit B</strong> (Other Clients) and <strong>Exhibit C</strong> (Capital Investment)
                — see end of this letter.
              </li>
              {isChapter624 && (
                <li>
                  <strong>NSCB license documentation</strong> — license number, classification, and monetary limit — or
                  evidence of engagement through an NSCB-licensed prime for the relevant scope.
                </li>
              )}
            </ol>
          </div>
        </section>
      )}

      <section className="break-inside-avoid space-y-3">
        <h2 className="text-sm font-semibold tracking-wider text-[var(--text-secondary)] uppercase">
          7. Relationship of the Parties
        </h2>
        <div className="space-y-3 text-sm leading-relaxed">
          <p>
            <strong>7.1 Independent Contractor Status.</strong> The relationship between Company and Contractor is that
            of independent contractor.{" "}
            <strong>
              Contractor controls and directs, in Contractor&rsquo;s sole discretion, the means, manner, methods,
              sequence, tools, equipment, procedures, and personnel by which the Services are performed.
            </strong>{" "}
            Contractor&rsquo;s performance is subject only to (i) the deliverables, acceptance criteria, and milestone
            dates referenced herein, (ii) reasonable coordination requirements necessary to interface with concurrent
            Activation operations, and (iii) compliance with venue, safety, regulatory, insurance, and event-permitting
            obligations of general applicability. Contractor is not subject to Company&rsquo;s employee handbook,
            performance review procedures, progressive discipline policies, training programs, or other employee
            directives, and shall not represent itself as Company&rsquo;s employee.
          </p>
          <p>
            <strong>7.2 Place of Performance and Course of Business.</strong>{" "}
            <strong>
              All services performed under this Agreement shall be performed at Contractor&rsquo;s own premises and at
              the Activation Site ({venueLine || venueJurisdiction}), a third-party venue and licensed event site that
              does not constitute a place of business of Company. Company maintains no offices, facilities, or places of
              business at the Activation Site.
            </strong>{" "}
            No services shall be required at any office, facility, studio, warehouse, or other place of business owned,
            leased, occupied, or operated by Company. The services are engaged in connection with a single-occurrence,
            time-limited experiential activation and do not constitute services performed in the ordinary course of
            operations at any Company place of business.
          </p>
          <p>
            <strong>7.3 Independently Established Trade.</strong>{" "}
            <strong>
              Contractor represents and warrants that Contractor is engaged in an independently established trade; holds
              Contractor out to the general public as available to perform such services for clients other than Company;
              has performed substantially similar services for at least two (2) other clients within the
              {tier === "tier_4_high_risk" ? " twelve (12) " : " twenty-four (24) "}months preceding the effective date
              (as itemized in Exhibit B); and bears the economic risk of profit or loss in Contractor&rsquo;s business.
            </strong>
          </p>
          <p>
            <strong>7.4 NRS 608.0155(1)(c) Five-Criteria Representations.</strong> Contractor further represents, in
            satisfaction of NRS 608.0155(1)(c), that <strong>(i)</strong> notwithstanding such control as may be
            necessary to comply with statutory, regulatory, or contractual obligations, Contractor has sole control and
            discretion over the means and manner of the performance of the Services and the result of the work;{" "}
            <strong>(ii)</strong> Contractor has control over the time during which the Services are performed, subject
            only to the milestone dates herein; <strong>(iii)</strong> Contractor is not required to work exclusively
            for Company and is free to engage with other principals during the term; <strong>(iv)</strong> Contractor is
            free to engage, at Contractor&rsquo;s own expense, employees, subcontractors, or assistants to perform any
            portion of the Services; and <strong>(v)</strong> Contractor contributes a substantial investment of capital
            in Contractor&rsquo;s business, as itemized in Exhibit C.
          </p>
        </div>
      </section>

      {letter.effective_terms && (
        <section className="break-inside-avoid space-y-3">
          <h2 className="text-sm font-semibold tracking-wider text-[var(--text-secondary)] uppercase">
            8. Terms &amp; Conditions
          </h2>
          <div className="space-y-3 text-sm leading-relaxed">
            {letter.effective_terms.split(/\n\n+/).map((para, i) => (
              <p key={i}>{renderInlineBold(para)}</p>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold tracking-wider text-[var(--text-secondary)] uppercase">
          9. Governing Law &amp; Confidentiality
        </h2>
        <p className="text-sm leading-relaxed">
          This Agreement is governed by the laws of the <strong>{letter.effective_governing_law}</strong>, without
          regard to its conflict-of-laws principles. Venue lies in the state and federal courts of{" "}
          <strong>Clark County, Nevada</strong>. Disputes shall be resolved through good-faith negotiation in the first
          instance; should formal proceedings become necessary, venue shall lie as stated.
        </p>
        {letter.effective_confidentiality && (
          <p className="text-sm leading-relaxed">
            The terms of this letter — including engagement window, role, compensation, schedule, and onboarding
            requirements — are confidential and proprietary to {EMPLOYER_LABEL[letter.employer]}. Contractor agrees not
            to disclose, reproduce, or share any portion of this letter, except with Contractor&rsquo;s legal, tax, or
            financial counsel acting on Contractor&rsquo;s behalf and bound by professional confidentiality obligations.
            This obligation survives the conclusion of the engagement.
          </p>
        )}
      </section>

      <section className="break-inside-avoid space-y-3 border-t border-[var(--border-default)] pt-6">
        <h2 className="text-sm font-semibold tracking-wider text-[var(--text-secondary)] uppercase">
          Exhibit B — Other Clients
        </h2>
        <p className="text-xs text-[var(--text-muted)]">
          Contractor represents that Contractor has performed substantially similar services for the following clients
          within the {tier === "tier_4_high_risk" ? "twelve (12)" : "twenty-four (24)"} months preceding the effective
          date of this Agreement. By countersigning below, Contractor affirms the truthfulness of this Exhibit B.
        </p>
        <ExhibitFillIn rows={3} columns={["Client", "Project", "Dates"]} />
      </section>

      <section className="break-inside-avoid space-y-3">
        <h2 className="text-sm font-semibold tracking-wider text-[var(--text-secondary)] uppercase">
          Exhibit C — Capital Investment Itemization
        </h2>
        <p className="text-xs text-[var(--text-muted)]">
          Contractor&rsquo;s capital investment in Contractor&rsquo;s business relevant to the Services may include,
          without limitation, the items below. By countersigning below, Contractor affirms the truthfulness of these
          representations.
        </p>
        <ul className="ms-4 list-disc space-y-1 text-sm">
          <li>Business entity (LLC / Corp / Sole Proprietorship — name and formation state)</li>
          <li>Insurance carried (CGL, professional liability, automobile, workers&rsquo; compensation)</li>
          <li>Software, equipment, tools, vehicles, and infrastructure owned or licensed by Contractor</li>
          <li>Pre-engagement preparation, certifications, and time invested at Contractor&rsquo;s risk</li>
          {isChapter624 && (
            <li>
              <strong>NSCB license</strong> — number, classification, and monetary limit (Chapter 624 trade scope)
            </li>
          )}
          {tier === "tier_3_trade" && (
            <li>
              Operator / trade certifications (OSHA, NCCCO, manufacturer-specific, journeyman cards as applicable)
            </li>
          )}
        </ul>
        <ExhibitFillIn rows={4} columns={["Item / Category", "Description / Value"]} />
      </section>

      <section className="border-t border-[var(--border-default)] pt-6">
        {letter.status === "accepted" && letter.accepted_signature ? (
          <div className="space-y-2">
            <div className="text-xs tracking-widest text-[var(--text-muted)] uppercase">Accepted</div>
            <div className="font-subdisplay text-2xl tracking-wide">{letter.accepted_signature}</div>
            <div className="text-xs text-[var(--text-muted)]">
              Counter-signed {letter.accepted_at ? formatDateTime(letter.accepted_at) : ""}
            </div>
          </div>
        ) : (
          <div className="space-y-2 text-sm text-[var(--text-muted)]">
            <div className="text-xs tracking-widest uppercase">Awaiting Counter-Signature</div>
            <div>
              Type your full legal name below to formalize acceptance. Your typed signature, IP address, and timestamp
              will be captured as the audit trail.
            </div>
          </div>
        )}
        <div className="mt-6 grid grid-cols-2 gap-6 text-xs text-[var(--text-muted)]">
          <div>
            <div className="font-medium text-[var(--text-secondary)]">For {EMPLOYER_LABEL[letter.employer]}</div>
            <div className="font-subdisplay text-lg tracking-wide">
              {letter.signing_authority_name ?? "Julian Clarkson"}
            </div>
            <div>{letter.signing_authority_title ?? "Producer & Operations Director"}</div>
            <div>{letter.signing_authority_email ?? ""}</div>
          </div>
          <div className="text-end">
            <div>Reference</div>
            <div className="font-mono">OL-{letter.id.slice(0, 8).toUpperCase()}</div>
          </div>
        </div>
      </section>
    </article>
  );
}

function DefinitionList({ rows }: { rows: Array<[string, string]> }) {
  return (
    <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {rows.map(([k, v]) => (
        <div key={k} className="space-y-0.5">
          <dt className="text-xs tracking-wider text-[var(--text-muted)] uppercase">{k}</dt>
          <dd className="text-sm">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Tiny inline-markdown renderer for `**bold**` segments. No other markdown handled. */
function renderInlineBold(text: string): ReactNode[] {
  return text
    .split(/\*\*/)
    .map((part, i) => (i % 2 === 1 ? <strong key={i}>{part}</strong> : <span key={i}>{part}</span>));
}

function ExhibitFillIn({ rows, columns }: { rows: number; columns: string[] }) {
  return (
    <div className="overflow-hidden rounded border border-[var(--border-default)]">
      <table className="w-full text-xs">
        <thead className="bg-[var(--surface-inset)] text-[var(--text-muted)]">
          <tr>
            {columns.map((c) => (
              <th key={c} className="px-3 py-2 text-start font-medium tracking-wider uppercase">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i} className="border-t border-[var(--border-default)]">
              {columns.map((_c, j) => (
                <td key={j} className="px-3 py-3">
                  <div className="h-4 border-b border-dashed border-[var(--border-default)]" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EngagementRow({ label, date, bold = false }: { label: string; date: string | null; bold?: boolean }) {
  const display = date ? formatDate(date, "long") : "—";
  return (
    <tr className="border-t border-[var(--border-default)] first:border-t-0">
      <td className="w-44 px-3 py-2 text-xs tracking-wider text-[var(--text-muted)] uppercase">{label}</td>
      <td className={`px-3 py-2 text-sm ${bold ? "font-medium" : ""}`}>{display}</td>
    </tr>
  );
}
