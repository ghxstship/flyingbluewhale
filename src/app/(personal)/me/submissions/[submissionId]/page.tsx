import { requireSession } from "@/lib/auth";
import { WithdrawButton } from "./WithdrawButton";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { STATUS_TONE } from "@/lib/marketplace";
import { formatMoney } from "@/lib/i18n/format";
import { toTitle } from "@/lib/format";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

type Sub = {
  id: string;
  org_id: string;
  submission_state: string;
  cover_note: string | null;
  fee_proposed_cents: number | null;
  submitted_at: string;
  talent_profile_id: string | null;
  open_call_id: string;
};

export default async function Page({ params }: { params: Promise<{ submissionId: string }> }) {
  const { submissionId } = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const supabase = await createClient();
  const { t } = await getRequestT();
  const fmt = await getRequestFormatters();
  const { data } = await supabase
    .from("open_call_submissions")
    .select("*")
    .eq("id", submissionId)
    .eq("submitter_user_id", session.userId)
    .maybeSingle();
  if (!data) return notFound();
  const s = data as Sub;

  return (
    <div>
      <div className="eyebrow">
        {t("me.submissions.detail.eyebrow", undefined, "Submission")}
      </div>
      <div className="mt-1 flex items-center gap-2">
        <h1>#{s.id.slice(0, 8)}</h1>
        <Badge variant={STATUS_TONE[s.submission_state] ?? "muted"}>{toTitle(s.submission_state)}</Badge>
      </div>
      <p className="mt-2 text-sm text-[var(--p-text-2)]">
        {t(
          "me.submissions.detail.submittedAt",
          { when: fmt.dateTime(new Date(s.submitted_at)) },
          "Submitted {when}",
        )}
      </p>

      <div className="mt-6 space-y-4">
        <div className="surface-raised p-4">
          <div className="eyebrow">
            {t("me.submissions.detail.coverNote", undefined, "Cover note")}
          </div>
          <div className="mt-1 text-sm whitespace-pre-wrap">{s.cover_note ?? "—"}</div>
        </div>
        {s.fee_proposed_cents && (
          <div className="surface-raised p-4">
            <div className="eyebrow">
              {t("me.submissions.detail.proposedFee", undefined, "Proposed fee")}
            </div>
            <div className="mt-1 font-mono text-sm">{formatMoney(s.fee_proposed_cents)}</div>
          </div>
        )}
        {["submitted", "shortlisted"].includes(s.submission_state) && (
          <div className="surface-raised p-4">
            <WithdrawButton
              submissionId={s.id}
              labels={{
                withdraw: t("me.submissions.detail.withdraw", undefined, "Withdraw Submission"),
                confirm: t(
                  "me.submissions.detail.withdrawConfirm",
                  undefined,
                  "Withdraw this submission? The organizer will be notified and this cannot be undone.",
                ),
                cancel: t("me.submissions.detail.keep", undefined, "Keep It"),
                done: t("me.submissions.detail.withdrawn", undefined, "Submission withdrawn."),
              }}
            />
          </div>
        )}
        {s.submission_state === "awarded" && (
          <div className="surface-raised flex items-center justify-between p-4">
            <div>
              <div className="eyebrow">
                {t("me.submissions.detail.review.label", undefined, "Awarded and wrapped?")}
              </div>
              <div className="mt-1 text-sm text-[var(--p-text-2)]">
                {t(
                  "me.submissions.detail.review.body",
                  undefined,
                  "Rate the working relationship. Reviews stay hidden until both sides post.",
                )}
              </div>
            </div>
            <Button
              href={`/me/reviews/new?transactionType=open_call_submission&transactionId=${s.id}&subjectType=org&subjectId=${s.org_id}`}
            >
              {t("me.submissions.detail.review.cta", undefined, "Write A Review")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
