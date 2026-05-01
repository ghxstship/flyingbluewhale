import type { OfferLetter } from "@/lib/offer-letters/types";
import { EMPLOYER_LABEL, CLASSIFICATION_LABEL, BASIS_LABEL } from "@/lib/offer-letters/types";
import { formatCompensation, formatDateRange } from "@/lib/offer-letters/format";

/**
 * Branded, print-friendly engagement letter. Rendered in the admin preview
 * AND on the public /offer/[token] route. No client interactivity.
 */
export function LetterDocument({ letter, projectLabel }: { letter: OfferLetter; projectLabel: string }) {
  const issuedOn = new Date(letter.created_at).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <article className="surface-raised mx-auto max-w-3xl space-y-8 p-10 print:p-0 print:shadow-none">
      <header className="flex items-start justify-between border-b border-[var(--border-default)] pb-6">
        <div>
          <div className="font-mono text-xs tracking-widest text-[var(--text-muted)] uppercase">
            {EMPLOYER_LABEL[letter.employer]}
          </div>
          <h1 className="mt-2 text-2xl leading-tight font-semibold">Engagement Letter</h1>
          <div className="mt-1 text-sm text-[var(--text-muted)]">{projectLabel}</div>
        </div>
        <div className="text-end text-xs text-[var(--text-muted)]">
          <div>Issued {issuedOn}</div>
          <div className="font-mono">REF · OL-{letter.id.slice(0, 8).toUpperCase()}</div>
        </div>
      </header>

      <section className="space-y-2">
        <div className="text-xs tracking-widest text-[var(--text-muted)] uppercase">Recipient</div>
        <div className="text-base font-medium">{letter.recipient_name}</div>
        <div className="font-mono text-xs text-[var(--text-muted)]">
          {letter.recipient_email}
          {letter.recipient_phone ? ` · ${letter.recipient_phone}` : ""}
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-sm leading-relaxed">
          Dear <strong>{letter.recipient_name.split(" ")[0]}</strong>,
        </p>
        <p className="text-sm leading-relaxed">
          On behalf of {EMPLOYER_LABEL[letter.employer]}, we are pleased to offer you the role of{" "}
          <strong>{letter.role_title}</strong> for <strong>{projectLabel}</strong>. This letter outlines the engagement,
          compensation, and terms under which we propose to work together.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold tracking-wider text-[var(--text-secondary)] uppercase">
          1. Engagement Summary
        </h2>
        <DefinitionList
          rows={[
            ["Role", letter.role_title],
            ["Department", letter.department || "—"],
            ["Classification", CLASSIFICATION_LABEL[letter.classification]],
            [
              "Reports To",
              letter.reports_to_name
                ? `${letter.reports_to_name}${letter.reports_to_email ? ` · ${letter.reports_to_email}` : ""}`
                : "—",
            ],
            ["Work Location", letter.work_location || "—"],
            ["Engagement Window", formatDateRange(letter.engagement_start, letter.engagement_end)],
          ]}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold tracking-wider text-[var(--text-secondary)] uppercase">2. Compensation</h2>
        <DefinitionList
          rows={[
            ["Basis", BASIS_LABEL[letter.compensation_basis]],
            ["Compensation", formatCompensation(letter)],
            [
              "Per Diem",
              letter.per_diem_cents > 0
                ? `${(letter.per_diem_cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" })} per day`
                : "—",
            ],
            ["Payment Schedule", letter.payment_schedule || "60 % deposit on signature, 40 % balance on load-in"],
          ]}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold tracking-wider text-[var(--text-secondary)] uppercase">3. Inclusions</h2>
        <ul className="space-y-1 text-sm">
          {(letter.inclusions ?? []).length === 0 && (
            <li className="text-[var(--text-muted)]">No additional inclusions specified.</li>
          )}
          {(letter.inclusions ?? []).map((item, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-[var(--text-muted)]">·</span>
              <span>{item}</span>
            </li>
          ))}
          {letter.travel_provided && (
            <li className="flex gap-2">
              <span className="text-[var(--text-muted)]">·</span>
              <span>Travel provided / arranged</span>
            </li>
          )}
          {letter.lodging_provided && (
            <li className="flex gap-2">
              <span className="text-[var(--text-muted)]">·</span>
              <span>Lodging provided</span>
            </li>
          )}
          {letter.meals_provided && (
            <li className="flex gap-2">
              <span className="text-[var(--text-muted)]">·</span>
              <span>Crew meals on call days</span>
            </li>
          )}
        </ul>
      </section>

      {letter.expectations && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold tracking-wider text-[var(--text-secondary)] uppercase">
            4. Expectations
          </h2>
          <p className="text-sm leading-relaxed whitespace-pre-line">{letter.expectations}</p>
        </section>
      )}

      {letter.terms && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold tracking-wider text-[var(--text-secondary)] uppercase">5. Terms</h2>
          <p className="text-sm leading-relaxed whitespace-pre-line">{letter.terms}</p>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold tracking-wider text-[var(--text-secondary)] uppercase">
          6. Governing Law & Confidentiality
        </h2>
        <p className="text-sm leading-relaxed">
          This engagement is governed by the laws of the {letter.governing_law}.{" "}
          {letter.confidentiality && (
            <>
              The contents of this letter are confidential and may not be shared outside the recipient and their direct
              counsel.
            </>
          )}
        </p>
      </section>

      <section className="border-t border-[var(--border-default)] pt-6">
        {letter.status === "accepted" && letter.accepted_signature ? (
          <div className="space-y-2">
            <div className="text-xs tracking-widest text-[var(--text-muted)] uppercase">Accepted</div>
            <div className="font-serif text-2xl italic">{letter.accepted_signature}</div>
            <div className="text-xs text-[var(--text-muted)]">
              Counter-signed {letter.accepted_at ? new Date(letter.accepted_at).toLocaleString() : ""}
            </div>
          </div>
        ) : (
          <div className="space-y-2 text-sm text-[var(--text-muted)]">
            <div className="text-xs tracking-widest uppercase">Awaiting Counter-Signature</div>
            <div>Type your full legal name on the public link to accept this offer.</div>
          </div>
        )}
        <div className="mt-6 grid grid-cols-2 gap-6 text-xs text-[var(--text-muted)]">
          <div>
            <div className="font-medium text-[var(--text-secondary)]">For {EMPLOYER_LABEL[letter.employer]}</div>
            <div className="font-serif text-lg italic">Julian Clarkson</div>
            <div>Operations Director</div>
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
