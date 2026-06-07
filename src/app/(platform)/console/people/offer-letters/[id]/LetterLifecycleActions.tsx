"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { useT } from "@/lib/i18n/LocaleProvider";
import type { OfferLetterStatus } from "@/lib/offer-letters/types";
import { sendLetter, withdrawLetter, rotateLetterCode } from "./actions";

export function LetterLifecycleActions({
  letterId,
  status,
  hasMsa = true,
  msaIssueHref = "/console/people/msas/new",
}: {
  letterId: string;
  status: OfferLetterStatus;
  /** When false, Send is gated — admin must issue an MSA first. */
  hasMsa?: boolean;
  msaIssueHref?: string;
}) {
  const t = useT();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const send = () =>
    start(async () => {
      setError(null);
      const result = await sendLetter(letterId, null, new FormData());
      if (result && "error" in result && result.error) setError(result.error);
    });
  const withdraw = () =>
    start(async () => {
      await withdrawLetter(letterId, null, new FormData());
    });
  const rotate = () =>
    start(async () => {
      await rotateLetterCode(letterId, null, new FormData());
    });

  const sendDisabled = !hasMsa;

  return (
    <section className="surface space-y-3 p-5">
      <h3 className="text-sm font-semibold tracking-wider uppercase">
        {t("console.people.offerLetters.lifecycle.title", undefined, "Lifecycle")}
      </h3>
      <div className="flex flex-col gap-2">
        {status === "draft" && (
          <>
            <Button onClick={send} loading={pending} disabled={sendDisabled}>
              {t("console.people.offerLetters.lifecycle.markSent", undefined, "Mark Sent — Activate Public Link")}
            </Button>
            {sendDisabled && (
              <div className="rounded border border-[var(--p-warning)]/40 bg-[var(--p-warning)]/10 p-3 text-xs leading-relaxed">
                <div className="mb-1 font-medium tracking-wider text-[var(--p-text-2)] uppercase">
                  {t("console.people.offerLetters.lifecycle.msaRequired", undefined, "MSA Required Before Send")}
                </div>
                <p>
                  {t(
                    "console.people.offerLetters.lifecycle.msaRequiredBody",
                    undefined,
                    "No Master Services Agreement on file for this contractor. Issue an MSA first; the recipient’s engagement letter references it.",
                  )}{" "}
                  <Link className="text-[var(--p-accent)] hover:underline" href={msaIssueHref}>
                    {t("console.people.offerLetters.lifecycle.issueMsa", undefined, "Issue MSA →")}
                  </Link>
                </p>
              </div>
            )}
          </>
        )}
        {status !== "draft" && status !== "withdrawn" && status !== "accepted" && status !== "declined" && (
          <Button variant="secondary" onClick={withdraw} loading={pending}>
            {t("console.people.offerLetters.lifecycle.withdraw", undefined, "Withdraw Letter")}
          </Button>
        )}
        {status !== "accepted" && status !== "declined" && status !== "withdrawn" && (
          <Button variant="ghost" size="sm" onClick={rotate} loading={pending}>
            {t("console.people.offerLetters.lifecycle.rotateCode", undefined, "Rotate Access Code")}
          </Button>
        )}
      </div>
      {error && (
        <p className="text-xs text-[var(--p-danger)]" role="alert">
          {error}
        </p>
      )}
      <p className="text-xs text-[var(--p-text-2)]">
        {t(
          "console.people.offerLetters.lifecycle.lockedNote",
          undefined,
          "Once accepted or declined, the letter is locked and the recipient’s decision is binding.",
        )}
      </p>
    </section>
  );
}
