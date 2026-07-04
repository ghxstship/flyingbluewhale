"use client";

import { FormShell } from "@/components/FormShell";
import { useT } from "@/lib/i18n/LocaleProvider";
import { bookSubmissionAction } from "./actions";

/**
 * "Book" form (v7.8 record action). Performance date + fee; the server
 * action re-validates the submission state so a stale tab can't
 * double-book. Fee defaults to the submitter's proposed fee when one
 * exists.
 */
export function BookOfferForm({ submissionId, defaultFee }: { submissionId: string; defaultFee?: string }) {
  const t = useT();
  return (
    <FormShell
      action={bookSubmissionAction.bind(null, submissionId)}
      submitLabel={t("console.marketplace.calls.submissions.detail.book.submit", undefined, "Book Talent Offer")}
      dirtyGuard={false}
      className="space-y-3"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-xs font-medium text-[var(--p-text-2)]" htmlFor="book-offer-date">
            {t("console.marketplace.calls.submissions.detail.book.date", undefined, "Performance Date")}
          </label>
          <input id="book-offer-date" name="performance_date" type="date" required className="ps-input mt-1.5 w-full" />
        </div>
        <div>
          <label className="text-xs font-medium text-[var(--p-text-2)]" htmlFor="book-offer-fee">
            {t("console.marketplace.calls.submissions.detail.book.fee", undefined, "Fee (USD)")}
          </label>
          <input
            id="book-offer-fee"
            name="fee"
            type="number"
            min="0.01"
            step="0.01"
            required
            defaultValue={defaultFee}
            className="ps-input mt-1.5 w-full"
          />
        </div>
      </div>
    </FormShell>
  );
}
