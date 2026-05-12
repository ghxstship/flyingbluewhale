import type { ReactNode } from "react";
import type { OfferLetterResolved } from "@/lib/offer-letters/types";
import { EMPLOYER_LABEL, CLASSIFICATION_LABEL, BASIS_LABEL } from "@/lib/offer-letters/types";
import { formatCompensation, formatDollars } from "@/lib/offer-letters/format";
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
              <strong className="text-[var(--text-primary)]">{letter.engagement_days}</strong> working day
              {letter.engagement_days === 1 ? "" : "s"} on site — drives the per-day compensation calculation in §2.
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
            [
              "Per Diem",
              letter.effective_per_diem_cents > 0 ? `${formatDollars(letter.effective_per_diem_cents)} per day` : "—",
            ],
            ["Payment Schedule", letter.effective_payment_schedule],
          ]}
        />
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
            Project production schedule milestones. Dates and activities are subject to change at any time, with or
            without notice; your manager will confirm the day-of details.
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
              const guideStep: import("@/lib/offer-letters/types").OnboardingItem | null = letter.guide_url
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
        </section>
      )}

      {letter.effective_terms && (
        <section className="break-inside-avoid space-y-3">
          <h2 className="text-sm font-semibold tracking-wider text-[var(--text-secondary)] uppercase">
            7. Terms &amp; Conditions
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
          8. Governing Law &amp; Confidentiality
        </h2>
        <p className="text-sm leading-relaxed">
          This engagement is governed by the laws of the {letter.effective_governing_law}, without regard to its
          conflict-of-laws principles. Any dispute arising from or relating to this engagement shall be resolved through
          good-faith negotiation in the first instance; should formal proceedings become necessary, venue shall lie in
          the {letter.effective_governing_law}.
        </p>
        {letter.effective_confidentiality && (
          <p className="text-sm leading-relaxed">
            The terms of this letter — including engagement window, role, compensation, schedule, and onboarding
            requirements — are confidential and proprietary to {EMPLOYER_LABEL[letter.employer]}. Recipient agrees not
            to disclose, reproduce, or share any portion of this letter, except with Recipient&rsquo;s legal, tax, or
            financial counsel acting on Recipient&rsquo;s behalf and bound by professional confidentiality obligations.
            This obligation survives the conclusion of the engagement.
          </p>
        )}
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

function EngagementRow({ label, date, bold = false }: { label: string; date: string | null; bold?: boolean }) {
  const display = date ? formatDate(date, "long") : "—";
  return (
    <tr className="border-t border-[var(--border-default)] first:border-t-0">
      <td className="w-44 px-3 py-2 text-xs tracking-wider text-[var(--text-muted)] uppercase">{label}</td>
      <td className={`px-3 py-2 text-sm ${bold ? "font-medium" : ""}`}>{display}</td>
    </tr>
  );
}
