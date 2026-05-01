"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/Button";
import type { OfferLetterStatus } from "@/lib/offer-letters/types";
import { sendLetter, withdrawLetter, rotateLetterCode } from "./actions";

export function LetterLifecycleActions({ letterId, status }: { letterId: string; status: OfferLetterStatus }) {
  const [pending, start] = useTransition();

  const send = () =>
    start(async () => {
      await sendLetter(letterId, null, new FormData());
    });
  const withdraw = () =>
    start(async () => {
      await withdrawLetter(letterId, null, new FormData());
    });
  const rotate = () =>
    start(async () => {
      await rotateLetterCode(letterId, null, new FormData());
    });

  return (
    <section className="surface space-y-3 p-5">
      <h3 className="text-sm font-semibold tracking-wider uppercase">Lifecycle</h3>
      <div className="flex flex-col gap-2">
        {status === "draft" && (
          <Button onClick={send} loading={pending}>
            Mark sent — activate public link
          </Button>
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
      <p className="text-xs text-[var(--text-muted)]">
        Once accepted or declined, the letter is locked and the recipient&apos;s decision is binding.
      </p>
    </section>
  );
}
