import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { notFound } from "next/navigation";
import { SUBMISSION_STATUSES, STATUS_TONE } from "@/lib/marketplace";
import { formatMoney } from "@/lib/i18n/format";
import { toTitle } from "@/lib/format";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { transitionSubmissionAction } from "./actions";
import { BookOfferForm } from "./BookOfferForm";

export const dynamic = "force-dynamic";

type Sub = {
  id: string;
  submitter_user_id: string;
  talent_profile_id: string | null;
  submission_state: string;
  score: number | null;
  internal_notes: string | null;
  cover_note: string | null;
  fee_proposed_cents: number | null;
  submitted_at: string;
};

export default async function Page({ params }: { params: Promise<{ callId: string; submissionId: string }> }) {
  const { callId, submissionId } = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const { t } = await getRequestT();
  const fmt = await getRequestFormatters();
  const supabase = await createClient();
  const { data } = await supabase
    .from("open_call_submissions")
    .select("*")
    .eq("id", submissionId)
    .eq("open_call_id", callId)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!data) return notFound();
  const s = data as Sub;
  // Mirrors BOOKABLE_STATES in ./actions.ts (the action re-validates
  // server-side; this only gates the form card's visibility).
  const canBook =
    isManagerPlus(session) &&
    (s.submission_state === "submitted" || s.submission_state === "shortlisted") &&
    !!s.talent_profile_id;

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.marketplace.calls.submissions.detail.eyebrow", undefined, "Submission")}
        title={`#${s.id.slice(0, 8)}`}
        subtitle={t(
          "console.marketplace.calls.submissions.detail.submittedAt",
          { date: fmt.dateTime(new Date(s.submitted_at)) },
          `Submitted ${fmt.dateTime(new Date(s.submitted_at))}`,
        )}
        action={<Badge variant={STATUS_TONE[s.submission_state] ?? "muted"}>{toTitle(s.submission_state)}</Badge>}
      />
      <div className="page-content max-w-2xl space-y-5">
        <section className="surface p-5">
          <h2 className="mb-2 text-sm font-semibold tracking-wide uppercase">
            {t("console.marketplace.calls.submissions.detail.coverNote", undefined, "Cover Note")}
          </h2>
          <div className="text-sm whitespace-pre-wrap">{s.cover_note ?? "—"}</div>
        </section>

        <section className="surface p-5">
          <h2 className="mb-2 text-sm font-semibold tracking-wide uppercase">
            {t("console.marketplace.calls.submissions.detail.submitter", undefined, "Submitter")}
          </h2>
          <dl className="space-y-1 text-sm">
            <div>
              <span className="text-[var(--p-text-2)]">
                {t("console.marketplace.calls.submissions.detail.userLabel", undefined, "User:")}
              </span>{" "}
              <span className="font-mono">{s.submitter_user_id.slice(0, 8)}</span>
            </div>
            <div>
              <span className="text-[var(--p-text-2)]">
                {t("console.marketplace.calls.submissions.detail.talentProfileLabel", undefined, "Talent profile:")}
              </span>{" "}
              {s.talent_profile_id ? (
                <a
                  className="font-mono text-[var(--p-accent)]"
                  href={`/studio/marketplace/talent/${s.talent_profile_id}`}
                >
                  ↗
                </a>
              ) : (
                "—"
              )}
            </div>
            <div>
              <span className="text-[var(--p-text-2)]">
                {t("console.marketplace.calls.submissions.detail.proposedFeeLabel", undefined, "Proposed fee:")}
              </span>{" "}
              {s.fee_proposed_cents ? formatMoney(s.fee_proposed_cents) : "—"}
            </div>
            {s.score != null && (
              <div>
                <span className="text-[var(--p-text-2)]">
                  {t("console.marketplace.calls.submissions.detail.scoreLabel", undefined, "Score:")}
                </span>{" "}
                <span className="font-mono">{s.score}</span>
              </div>
            )}
          </dl>
        </section>

        {s.internal_notes && (
          <section className="surface p-5">
            <h2 className="mb-2 text-sm font-semibold tracking-wide uppercase">
              {t("console.marketplace.calls.submissions.detail.internalNotes", undefined, "Internal Notes")}
            </h2>
            <div className="text-sm whitespace-pre-wrap">{s.internal_notes}</div>
          </section>
        )}

        {canBook && (
          <section className="surface p-5">
            <h2 className="mb-3 text-sm font-semibold tracking-wide uppercase">
              {t("console.marketplace.calls.submissions.detail.book.heading", undefined, "Book This Talent")}
            </h2>
            <BookOfferForm
              submissionId={s.id}
              defaultFee={s.fee_proposed_cents ? (s.fee_proposed_cents / 100).toFixed(2) : undefined}
            />
          </section>
        )}

        <section className="surface p-5">
          <h2 className="mb-3 text-sm font-semibold tracking-wide uppercase">
            {t("console.marketplace.calls.submissions.detail.moveSubmission", undefined, "Move submission")}
          </h2>
          <FormShell
            action={transitionSubmissionAction}
            submitLabel={t("console.marketplace.calls.submissions.detail.updateStatus", undefined, "Update Status")}
          >
            <input type="hidden" name="submission_id" value={s.id} />
            <div>
              <label htmlFor="status" className="text-xs font-medium text-[var(--p-text-2)]">
                {t("console.marketplace.calls.submissions.detail.statusLabel", undefined, "Status")}
              </label>
              <select id="status" name="status" className="ps-input mt-1.5 w-full" defaultValue={s.submission_state}>
                {SUBMISSION_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label={t("console.marketplace.calls.submissions.detail.scoreInputLabel", undefined, "Score (0-100)")}
              name="score"
              type="number"
              min={0}
              max={100}
              defaultValue={s.score ?? ""}
            />
            <div>
              <label htmlFor="internal_notes" className="text-xs font-medium text-[var(--p-text-2)]">
                {t("console.marketplace.calls.submissions.detail.internalNotes", undefined, "Internal Notes")}
              </label>
              <textarea id="internal_notes"
                name="internal_notes"
                rows={4}
                maxLength={4000}
                className="ps-input mt-1.5 w-full"
                defaultValue={s.internal_notes ?? ""}
              />
            </div>
          </FormShell>
        </section>
      </div>
    </>
  );
}
