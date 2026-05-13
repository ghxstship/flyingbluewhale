"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
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
      <h3 className="text-sm font-semibold tracking-wider uppercase">Lifecycle</h3>
      <div className="flex flex-col gap-2">
        {status === "draft" && (
          <>
            <Button onClick={send} loading={pending} disabled={sendDisabled}>
              Mark sent — activate public link
            </Button>
            {sendDisabled && (
              <div className="rounded border border-[var(--color-warning)]/40 bg-[var(--color-warning)]/10 p-3 text-xs leading-relaxed">
                <div className="mb-1 font-medium tracking-wider text-[var(--text-secondary)] uppercase">
                  MSA required before send
                </div>
                <p>
                  No Master Services Agreement on file for this contractor. Issue an MSA first; the recipient&rsquo;s
                  engagement letter references it.{" "}
                  <Link className="text-[var(--org-primary)] hover:underline" href={msaIssueHref}>
                    Issue MSA →
                  </Link>
                </p>
              </div>
            )}
          </>
        )}
        {status !== "draft" && status !== "withdrawn" && status !== "accepted" && status !== "declined" && (
          <Button variant="secondary" onClick={withdraw} loading={pending}>
            Withdraw letter
          </Button>
        )}
        {status !== "accepted" && status !== "declined" && status !== "withdrawn" && (
          <Button variant="ghost" size="sm" onClick={rotate} loading={pending}>
            Rotate access code
          </Button>
        )}
      </div>
      {error && (
        <p className="text-xs text-[var(--color-error)]" role="alert">
          {error}
        </p>
      )}
      <p className="text-xs text-[var(--text-muted)]">
        Once accepted or declined, the letter is locked and the recipient&apos;s decision is binding.
      </p>
    </section>
  );
}
