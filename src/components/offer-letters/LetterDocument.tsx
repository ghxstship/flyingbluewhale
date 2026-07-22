import type { OfferLetterResolved } from "@/lib/offer-letters/types";
import { EMPLOYER_LABEL, CLASSIFICATION_LABEL, BASIS_LABEL } from "@/lib/offer-letters/types";
import { formatCompensation, formatPerDiem } from "@/lib/offer-letters/format";
import { DEFAULT_SIGNING_AUTHORITY_NAME, DEFAULT_SIGNING_AUTHORITY_TITLE } from "@/lib/offer-letters/signing";
import { formatDate, formatDateTime } from "@/lib/i18n/format";
import type { CrewMemberActiveMsa } from "@/lib/msa/types";
import { BRAND } from "@/lib/brand";

type Translator = (key: string, vars?: Record<string, string | number>, fallback?: string) => string;

/** Identity translator — used when no `t` is supplied so the English fallbacks render verbatim. */
const identityT: Translator = (_key, _vars, fallback) => fallback ?? "";

/**
 * Engagement Letter — friendly deal-memo style.
 *
 * Holds the SOW + commercial terms (role, comp, schedule, inclusions,
 * onboarding) and references the contractor's Master Services Agreement
 * by link. All Nevada IC compliance language (Recitals, Relationship of
 * the Parties, Terms & Conditions, Governing Law, Exhibits B/C) lives in
 * the MSA — signed once per relationship, not per engagement.
 *
 * The doc renders with the baseline locale because letters are part of an
 * audit-grade artifact: switching the rendered date format per viewer would
 * break the contract record.
 */
export function LetterDocument({
  letter,
  activeMsa = null,
  msaSignerUrl = null,
  t = identityT,
}: {
  letter: OfferLetterResolved;
  /** The contractor's signed MSA, if any. Drives footer reference + onboarding gating. */
  activeMsa?: CrewMemberActiveMsa | null;
  /** The signer URL for the contractor's pending/active MSA (admin-resolved). */
  msaSignerUrl?: string | null;
  /** Request translator. Optional — falls back to English literals when omitted (e.g. legacy callers). */
  t?: Translator;
}) {
  const issuedOn = formatDate(letter.created_at, "long");
  const venueLine = [letter.venue_name, letter.venue_city, letter.venue_region].filter(Boolean).join(" · ");
  const msaOnFile = !!activeMsa?.signed_at;

  return (
    <article className="surface mx-auto max-w-3xl space-y-8 p-10 print:p-0 print:shadow-none">
      <header className="flex items-start justify-between border-b border-[var(--p-border)] pb-6">
        <div>
          <div className="font-mono text-xs tracking-widest text-[var(--p-text-2)] uppercase">
            {EMPLOYER_LABEL[letter.employer]}
          </div>
          <h1 className="mt-2 text-[length:var(--p-fs-h2)] leading-tight">
            {t("legal.letterDocument.title", undefined, "Engagement Letter")}
          </h1>
          <div className="mt-1 text-sm text-[var(--p-text-2)]">{letter.project_name}</div>
        </div>
        <div className="text-end text-xs text-[var(--p-text-2)]">
          <div>{t("legal.letterDocument.issued", { date: issuedOn }, `Issued ${issuedOn}`)}</div>
          <div className="font-mono" style={{ fontFamily: "var(--p-mono-data)" }}>
            REF · OL-{letter.id.slice(0, 8).toUpperCase()}
          </div>
        </div>
      </header>

      <section className="space-y-2">
        <div className="text-xs tracking-widest text-[var(--p-text-2)] uppercase">
          {t("legal.letterDocument.recipient", undefined, "Recipient")}
        </div>
        <div className="text-base font-medium">{letter.recipient_name}</div>
      </section>

      <section className="space-y-3">
        <p className="text-sm leading-relaxed">
          {t("legal.letterDocument.greeting", undefined, "Greetings")}{" "}
          <strong>{letter.recipient_name.split(" ")[0]}</strong>,
        </p>
        <p className="text-sm leading-relaxed">
          {t(
            "legal.letterDocument.introLead",
            { employer: EMPLOYER_LABEL[letter.employer] },
            `You're on the manifest. On behalf of ${EMPLOYER_LABEL[letter.employer]}, we're pleased to bring you on as`,
          )}{" "}
          <strong>{letter.role_title}</strong> {t("legal.letterDocument.introFor", undefined, "for")}{" "}
          <strong>{letter.project_name}</strong>.{" "}
          {t(
            "legal.letterDocument.introTail",
            undefined,
            "Full engagement details are outlined below. Please give it a read, then counter-sign at the bottom to make it official.",
          )}
        </p>
        {letter.signing_authority_name && letter.signing_authority_email && (
          <p className="text-xs text-[var(--p-text-2)]">
            {t("legal.letterDocument.questionsBeforeSigning", undefined, "Questions before signing? Reach")}{" "}
            <strong className="text-[var(--p-text-2)]">{letter.signing_authority_name}</strong>{" "}
            {t("legal.letterDocument.at", undefined, "at")}{" "}
            <a className="text-[var(--p-accent)] hover:underline" href={`mailto:${letter.signing_authority_email}`}>
              {letter.signing_authority_email}
            </a>
            .
          </p>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold tracking-wider text-[var(--p-text-2)] uppercase">
          {t("legal.letterDocument.engagementSummaryHeading", undefined, "1. Engagement Summary")}
        </h2>
        <DefinitionList
          rows={[
            [t("legal.letterDocument.role", undefined, "Role"), letter.role_title],
            [t("legal.letterDocument.department", undefined, "Department"), letter.role_department || "—"],
            [
              t("legal.letterDocument.classification", undefined, "Classification"),
              CLASSIFICATION_LABEL[letter.classification],
            ],
            [
              t("legal.letterDocument.reportsTo", undefined, "Reports To"),
              letter.reports_to_name
                ? `${letter.reports_to_name}${letter.reports_to_role ? ` · ${letter.reports_to_role}` : ""}`
                : "—",
            ],
            [t("legal.letterDocument.workLocation", undefined, "Work Location"), venueLine || "—"],
          ]}
        />

        <div className="mt-4 space-y-2">
          <div className="text-xs tracking-wider text-[var(--p-text-2)] uppercase">
            {t("legal.letterDocument.engagementWindow", undefined, "Engagement Window")}
          </div>
          <div className="overflow-hidden rounded border border-[var(--p-border)]">
            <table className="w-full text-xs">
              <tbody>
                <EngagementRow
                  label={t("legal.letterDocument.travelIn", undefined, "Travel In")}
                  date={letter.travel_in_date}
                />
                <EngagementRow
                  label={t("legal.letterDocument.onSiteStart", undefined, "On Site Start")}
                  date={letter.effective_onsite_start ?? letter.onsite_start_date}
                  bold
                />
                <EngagementRow
                  label={t("legal.letterDocument.onSiteEnd", undefined, "On Site End")}
                  date={letter.effective_onsite_end ?? letter.onsite_end_date}
                  bold
                />
                <EngagementRow
                  label={t("legal.letterDocument.travelOut", undefined, "Travel Out")}
                  date={letter.travel_out_date}
                />
              </tbody>
            </table>
          </div>
          {letter.engagement_days > 0 && (
            <div className="text-xs text-[var(--p-text-2)]">
              <strong className="text-[var(--p-text-1)]">{letter.engagement_days}</strong>{" "}
              {letter.engagement_days === 1
                ? t("legal.letterDocument.serviceDayOne", undefined, "projected service day on site.")
                : t("legal.letterDocument.serviceDayOther", undefined, "projected service days on site.")}
            </div>
          )}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold tracking-wider text-[var(--p-text-2)] uppercase">
          {t("legal.letterDocument.compensationHeading", undefined, "2. Compensation")}
        </h2>
        <DefinitionList
          rows={[
            [t("legal.letterDocument.basis", undefined, "Basis"), BASIS_LABEL[letter.compensation_basis]],
            [t("legal.letterDocument.compensation", undefined, "Compensation"), formatCompensation(letter)],
            [
              t("legal.letterDocument.travelLodgingReimbursement", undefined, "Travel + Lodging Reimbursement"),
              formatPerDiem(letter.effective_per_diem_cents),
            ],
            [
              t("legal.letterDocument.paymentSchedule", undefined, "Payment Schedule"),
              letter.effective_payment_schedule,
            ],
          ]}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold tracking-wider text-[var(--p-text-2)] uppercase">
          {t("legal.letterDocument.inclusionsHeading", undefined, "3. Inclusions")}
        </h2>
        <ul className="space-y-1 text-sm">
          {(letter.effective_inclusions ?? []).length === 0 && (
            <li className="text-[var(--p-text-2)]">
              {t("legal.letterDocument.noInclusions", undefined, "No additional inclusions specified.")}
            </li>
          )}
          {(letter.effective_inclusions ?? []).map((item, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-[var(--p-text-2)]">·</span>
              <span>{item}</span>
            </li>
          ))}
          {letter.effective_travel_provided && (
            <li className="flex gap-2">
              <span className="text-[var(--p-text-2)]">·</span>
              <span>{t("legal.letterDocument.travelProvided", undefined, "Travel provided / arranged")}</span>
            </li>
          )}
          {letter.effective_lodging_provided && (
            <li className="flex gap-2">
              <span className="text-[var(--p-text-2)]">·</span>
              <span>{t("legal.letterDocument.lodgingProvided", undefined, "Lodging provided")}</span>
            </li>
          )}
          {letter.effective_meals_provided && (
            <li className="flex gap-2">
              <span className="text-[var(--p-text-2)]">·</span>
              <span>{t("legal.letterDocument.mealsProvided", undefined, "Crew meals on call days")}</span>
            </li>
          )}
        </ul>
        {letter.effective_inclusions_footnote && (
          <p className="text-xs text-[var(--p-text-2)] italic">{letter.effective_inclusions_footnote}</p>
        )}
      </section>

      {letter.effective_expectations && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold tracking-wider text-[var(--p-text-2)] uppercase">
            {t("legal.letterDocument.scopeHeading", undefined, "4. Scope of Work")}
          </h2>
          <p className="text-sm leading-relaxed whitespace-pre-line">{letter.effective_expectations}</p>
        </section>
      )}

      {(letter.schedule_items?.length ?? 0) > 0 && (
        <section className="break-inside-avoid space-y-3">
          <h2 className="text-sm font-semibold tracking-wider text-[var(--p-text-2)] uppercase">
            {t("legal.letterDocument.scheduleHeading", undefined, "5. Working Schedule")}
          </h2>
          <p className="text-xs text-[var(--p-text-2)]">
            {t(
              "legal.letterDocument.scheduleHint",
              undefined,
              "Project production schedule milestones. Dates and activities are subject to revision based on production circumstances; we'll let you know about material changes through standard production channels.",
            )}
          </p>
          <div className="overflow-hidden rounded border border-[var(--p-border)]">
            <table className="w-full text-xs">
              <thead className="bg-[var(--p-surface-2)] text-[var(--p-text-2)]">
                <tr>
                  <th className="px-3 py-2 text-start font-medium tracking-wider uppercase">
                    {t("legal.letterDocument.colDate", undefined, "Date")}
                  </th>
                  <th className="px-3 py-2 text-start font-medium tracking-wider uppercase">
                    {t("legal.letterDocument.colCall", undefined, "Call")}
                  </th>
                  <th className="px-3 py-2 text-start font-medium tracking-wider uppercase">
                    {t("legal.letterDocument.colWrap", undefined, "Wrap")}
                  </th>
                  <th className="px-3 py-2 text-start font-medium tracking-wider uppercase">
                    {t("legal.letterDocument.colMilestones", undefined, "Milestones")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {letter.schedule_items.map((d, i) => (
                  <tr key={i} className="border-t border-[var(--p-border)] align-top">
                    <td className="px-3 py-2">
                      <div className="font-medium">{d.day_label}</div>
                      <div className="font-mono text-[11px] text-[var(--p-text-2)]" style={{ fontFamily: "var(--p-mono-data)" }}>{d.date}</div>
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

      <section className="break-inside-avoid space-y-3">
        <h2 className="text-sm font-semibold tracking-wider text-[var(--p-text-2)] uppercase">
          {t("legal.letterDocument.onboardingHeading", undefined, "6. Onboarding Checklist")}
        </h2>
        <p className="text-xs text-[var(--p-text-2)]">
          {t(
            "legal.letterDocument.onboardingHint",
            undefined,
            "A short list to get you ready. Try to close these out within 48 hours of acceptance so credentials can ship.",
          )}
        </p>
        <ol className="space-y-2 text-sm">
          {!msaOnFile && msaSignerUrl && (
            <li className="flex items-baseline gap-3 rounded border border-[var(--p-accent)] bg-[var(--p-surface-2)] p-3">
              <span
                aria-hidden
                className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded border border-[var(--p-accent)] text-[11px] font-semibold text-[var(--p-accent)]"
              >
                ★
              </span>
              <span className="flex-1">
                <span className="block">
                  <strong>{t("legal.letterDocument.signMsa", undefined, "Sign your Master Services Agreement")}</strong>
                  <a
                    href={msaSignerUrl}
                    className="ms-2 text-[11px] tracking-wider text-[var(--p-accent)] uppercase hover:underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t("legal.letterDocument.openMsaLink", undefined, "Open MSA ↗")}
                  </a>
                </span>
                <span className="mt-0.5 block text-xs text-[var(--p-text-2)]">
                  {t(
                    "legal.letterDocument.msaOneTimeNote",
                    undefined,
                    "One-time. Signs apply to every engagement we book you on, and you won't see this step again.",
                  )}
                </span>
              </span>
            </li>
          )}
          {(letter.effective_onboarding_items ?? [])
            .slice()
            .sort((a, b) => (a.order ?? 99) - (b.order ?? 99))
            .map((item) => (
              <li key={item.key} className="flex items-baseline gap-3">
                <span
                  aria-hidden
                  className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded border border-[var(--p-border)] text-[11px]"
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
                            className="ms-2 text-[11px] tracking-wider text-[var(--p-accent)] uppercase hover:underline"
                            target="_blank"
                            rel="noreferrer"
                          >
                            {l.label} ↗
                          </a>
                        ))
                      : item.link && (
                          <a
                            href={item.link}
                            className="ms-2 text-[11px] tracking-wider text-[var(--p-accent)] uppercase hover:underline"
                            target="_blank"
                            rel="noreferrer"
                          >
                            {t("legal.letterDocument.openLink", undefined, "Open ↗")}
                          </a>
                        )}
                  </span>
                  {item.note && <span className="mt-0.5 block text-xs text-[var(--p-text-2)]">{item.note}</span>}
                </span>
              </li>
            ))}
          {letter.guide_url && (
            <li className="flex items-baseline gap-3">
              <span
                aria-hidden
                className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded border border-[var(--p-border)] text-[11px]"
              >
                ★
              </span>
              <span className="flex-1">
                <span className="block">
                  {t("legal.letterDocument.reviewGuide", undefined, "Review the Salvage City Production Guide")}
                  <a
                    href={letter.guide_url}
                    className="ms-2 text-[11px] tracking-wider text-[var(--p-accent)] uppercase hover:underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t("legal.letterDocument.openLink", undefined, "Open ↗")}
                  </a>
                </span>
              </span>
            </li>
          )}
        </ol>
      </section>

      <section className="border-t border-[var(--p-border)] pt-6">
        {letter.status === "accepted" && letter.accepted_signature ? (
          <div className="space-y-2">
            <div className="text-xs tracking-widest text-[var(--p-text-2)] uppercase">
              {t("legal.letterDocument.accepted", undefined, "Accepted")}
            </div>
            <div className="font-subdisplay text-2xl tracking-wide">{letter.accepted_signature}</div>
            <div className="text-xs text-[var(--p-text-2)]">
              {t(
                "legal.letterDocument.counterSigned",
                { when: letter.accepted_at ? formatDateTime(letter.accepted_at) : "" },
                `Counter-signed ${letter.accepted_at ? formatDateTime(letter.accepted_at) : ""}`,
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-2 text-sm text-[var(--p-text-2)]">
            <div className="text-xs tracking-widest uppercase">
              {t("legal.letterDocument.awaitingCounterSignature", undefined, "Awaiting Counter-Signature")}
            </div>
            <div>
              {t(
                "legal.letterDocument.awaitingBody",
                undefined,
                "Type your full legal name below to formalize acceptance. Your typed signature, IP address, and timestamp will be captured as the audit trail.",
              )}
            </div>
          </div>
        )}
        <div className="mt-6 grid grid-cols-2 gap-6 text-xs text-[var(--p-text-2)]">
          <div>
            <div className="font-medium text-[var(--p-text-2)]">
              {t(
                "legal.letterDocument.forEmployer",
                { employer: EMPLOYER_LABEL[letter.employer] },
                `For ${EMPLOYER_LABEL[letter.employer]}`,
              )}
            </div>
            <div className="font-subdisplay text-lg tracking-wide">
              {letter.signing_authority_name ?? DEFAULT_SIGNING_AUTHORITY_NAME}
            </div>
            <div>
              {letter.signing_authority_title ??
                t("legal.letterDocument.signerTitle", undefined, DEFAULT_SIGNING_AUTHORITY_TITLE)}
            </div>
            <div>{letter.signing_authority_email ?? ""}</div>
          </div>
          <div className="text-end">
            <div>{t("legal.letterDocument.reference", undefined, "Reference")}</div>
            <div className="font-mono" style={{ fontFamily: "var(--p-mono-data)" }}>OL-{letter.id.slice(0, 8).toUpperCase()}</div>
          </div>
        </div>
      </section>

      <footer className="space-y-3 border-t border-[var(--p-border)] pt-6 text-xs text-[var(--p-text-2)]">
        {msaOnFile && activeMsa ? (
          <p>
            {t(
              "legal.letterDocument.footerMsaOnFile",
              { date: formatDate(activeMsa.signed_at, "long"), version: activeMsa.version },
              `This engagement is subject to your Independent Contractor Master Services Agreement signed ${formatDate(activeMsa.signed_at, "long")} · v${activeMsa.version}.`,
            )}{" "}
            {msaSignerUrl && (
              <a
                className="text-[var(--p-accent)] hover:underline"
                href={msaSignerUrl}
                target="_blank"
                rel="noreferrer"
              >
                {t("legal.letterDocument.viewMsaLink", undefined, "View MSA ↗")}
              </a>
            )}
          </p>
        ) : msaSignerUrl ? (
          <p>
            {t(
              "legal.letterDocument.footerMsaPendingPrefix",
              undefined,
              "This engagement is subject to our Independent Contractor Master Services Agreement:",
            )}{" "}
            <a className="text-[var(--p-accent)] hover:underline" href={msaSignerUrl} target="_blank" rel="noreferrer">
              {t("legal.letterDocument.readAndSignLink", undefined, "read & sign your copy ↗")}
            </a>{" "}
            {t(
              "legal.letterDocument.footerMsaPendingSuffix",
              undefined,
              "one-time, applies to every future engagement.",
            )}
          </p>
        ) : (
          <p>
            {t(
              "legal.letterDocument.footerMsaSeparateEmail",
              undefined,
              "This engagement is subject to our Independent Contractor Master Services Agreement. Your personal copy will arrive in a separate email and is required before your first service day.",
            )}
          </p>
        )}
        <p>
          {t(
            "legal.letterDocument.governingLaw",
            { employer: EMPLOYER_LABEL[letter.employer] },
            `Governing law: State of Nevada. Venue: Clark County, NV. Confidential and proprietary to ${EMPLOYER_LABEL[letter.employer]}.`,
          )}
        </p>
        {/* GHXSTSHIP parent endorsement — v4 logo-kit canon for formal
            documents. Mark on the left, parent skull endorsement on the
            right; reads as a small chrome strip below the legal terms. */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3">
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/atlvs-mark.svg" alt="" width={14} height={14} aria-hidden="true" />
            <span className="font-semibold tracking-[0.18em] uppercase">{BRAND.mark}</span>
            <span>· Technologies</span>
          </div>
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/logo-ghostship-skull.svg" alt="" width={12} height={12} aria-hidden="true" />
            <span className="tracking-[0.12em] uppercase">a G H X S T S H I P Industries company</span>
          </div>
        </div>
      </footer>
    </article>
  );
}

function DefinitionList({ rows }: { rows: Array<[string, string]> }) {
  return (
    <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {rows.map(([k, v]) => (
        <div key={k} className="space-y-0.5">
          <dt className="text-xs tracking-wider text-[var(--p-text-2)] uppercase">{k}</dt>
          <dd className="text-sm">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function EngagementRow({ label, date, bold = false }: { label: string; date: string | null; bold?: boolean }) {
  const display = date ? formatDate(date, "long") : "—";
  return (
    <tr className="border-t border-[var(--p-border)] first:border-t-0">
      <td className="w-44 px-3 py-2 text-xs tracking-wider text-[var(--p-text-2)] uppercase">{label}</td>
      <td className={`px-3 py-2 text-sm ${bold ? "font-medium" : ""}`}>{display}</td>
    </tr>
  );
}
