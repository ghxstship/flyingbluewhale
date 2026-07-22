import { requireSession } from "@/lib/auth";
import { hasSupabase } from "@/lib/env";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { FormShell } from "@/components/FormShell";
import { toTitle } from "@/lib/format";
import { getRequestT } from "@/lib/i18n/request";
import { REVIEW_SUBJECTS, REVIEW_TRANSACTIONS } from "@/lib/marketplace";
import { createReview } from "./actions";

export const dynamic = "force-dynamic";

const INPUT = "ps-input";
const LBL = "text-xs font-medium text-[var(--p-text-2)]";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Search = {
  transactionType?: string;
  transactionId?: string;
  subjectType?: string;
  subjectId?: string;
};

export default async function Page({ searchParams }: { searchParams: Promise<Search> }) {
  const { t } = await getRequestT();
  if (!hasSupabase) return <div>{t("me.reviews.configure", undefined, "Configure Supabase.")}</div>;
  await requireSession();
  const sp = await searchParams;

  const transactionType = (REVIEW_TRANSACTIONS as readonly string[]).includes(sp.transactionType ?? "")
    ? (sp.transactionType as (typeof REVIEW_TRANSACTIONS)[number])
    : null;
  const subjectType = (REVIEW_SUBJECTS as readonly string[]).includes(sp.subjectType ?? "")
    ? (sp.subjectType as (typeof REVIEW_SUBJECTS)[number])
    : null;
  const transactionId = sp.transactionId && UUID_RE.test(sp.transactionId) ? sp.transactionId : null;
  const subjectId = sp.subjectId && UUID_RE.test(sp.subjectId) ? sp.subjectId : null;

  const complete = transactionType && transactionId && subjectType && subjectId;

  if (!complete) {
    return (
      <div className="max-w-2xl space-y-6">
        <header>
          <div className="eyebrow">
            {t("me.reviews.new.eyebrow", undefined, "My reviews")}
          </div>
          <h1 className="mt-1">{t("me.reviews.new.title", undefined, "Write A Review")}</h1>
        </header>
        <div className="surface-raised space-y-3 p-6 text-sm text-[var(--p-text-2)]">
          <p>
            {t(
              "me.reviews.new.explainer.anchored",
              undefined,
              "Every review is anchored to a real transaction — a booking offer, an application, a submission, a purchase order, or a project. That's what keeps ratings honest.",
            )}
          </p>
          <p>
            {t(
              "me.reviews.new.explainer.start",
              undefined,
              "Start a review from the transaction itself: an offer in My Offers, an application in My Applications, or a submission in My Submissions. The Write a Review link there carries the transaction across so we know who and what you're rating.",
            )}
          </p>
          <p>
            {t(
              "me.reviews.new.explainer.hidden",
              undefined,
              "Reviews stay hidden until both sides post. No retaliation surface.",
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button href="/me/offers">{t("me.reviews.new.cta.offers", undefined, "My Offers")}</Button>
          <Button href="/me/applications" variant="ghost">
            {t("me.reviews.new.cta.applications", undefined, "My Applications")}
          </Button>
          <Button href="/me/reviews" variant="ghost">
            {t("me.reviews.new.cta.back", undefined, "Back To Reviews")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <header>
        <div className="eyebrow">
          {t("me.reviews.new.eyebrow", undefined, "My reviews")}
        </div>
        <h1 className="mt-1">{t("me.reviews.new.title", undefined, "Write A Review")}</h1>
        <p className="mt-2 text-sm text-[var(--p-text-2)]">
          {t(
            "me.reviews.new.subtitle",
            undefined,
            "Your review stays hidden until the other side posts theirs. Both release together.",
          )}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge variant="muted">{toTitle(transactionType)}</Badge>
          <Badge variant="muted">
            {t("me.reviews.new.subjectPrefix", undefined, "Reviewing")} {toTitle(subjectType)}
          </Badge>
        </div>
      </header>

      <FormShell
        action={createReview}
        cancelHref="/me/reviews"
        submitLabel={t("me.reviews.new.form.submit", undefined, "Post Review")}
        className="surface-raised space-y-4 p-6"
      >
        <input type="hidden" name="transaction_type" value={transactionType} />
        <input type="hidden" name="transaction_id" value={transactionId} />
        <input type="hidden" name="subject_kind" value={subjectType} />
        <input type="hidden" name="subject_id" value={subjectId} />

        <label className="flex flex-col gap-1.5">
          <span className={LBL}>
            {t("me.reviews.new.form.rating", undefined, "Rating")}
            <span className="ms-0.5 text-[var(--color-danger)]">*</span>
          </span>
          <select name="rating" required defaultValue="5" className={INPUT}>
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {"★".repeat(n)} · {n}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className={LBL}>{t("me.reviews.new.form.body", undefined, "Review")}</span>
          <textarea
            name="body"
            rows={6}
            maxLength={4000}
            placeholder={t(
              "me.reviews.new.form.bodyPlaceholder",
              undefined,
              "How was the working relationship? Communication, professionalism, would you work together again.",
            )}
            className={INPUT}
          />
        </label>
      </FormShell>
    </div>
  );
}
