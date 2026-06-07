"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { useT } from "@/lib/i18n/LocaleProvider";
import { sendOfferAction, acceptOfferAction, declineOfferAction } from "../new/actions";

export function OfferControls({ offerId, status }: { offerId: string; status: string }) {
  const t = useT();
  const [pending, startTransition] = useTransition();

  return (
    <section className="surface p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold tracking-wide uppercase">
            {t("console.marketplace.offers.controls.stateHeading", undefined, "State")}
          </h2>
          <p className="mt-1 text-xs text-[var(--p-text-2)]">
            {t(
              "console.marketplace.offers.controls.stateFlow",
              undefined,
              "draft → sent → countered → accepted → contracted",
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {status === "draft" && (
            <form
              action={(fd) => {
                startTransition(async () => {
                  await sendOfferAction(null, fd);
                });
              }}
            >
              <input type="hidden" name="offer_id" value={offerId} />
              <Button type="submit" size="sm" loading={pending}>
                {t("console.marketplace.offers.controls.sendOffer", undefined, "Send Offer")}
              </Button>
            </form>
          )}
          {(status === "sent" || status === "countered") && (
            <>
              <form
                action={(fd) => {
                  startTransition(async () => {
                    await acceptOfferAction(null, fd);
                  });
                }}
              >
                <input type="hidden" name="offer_id" value={offerId} />
                <Button type="submit" size="sm" loading={pending}>
                  {t("console.marketplace.offers.controls.markAccepted", undefined, "Mark Accepted")}
                </Button>
              </form>
              <form
                action={(fd) => {
                  startTransition(async () => {
                    await declineOfferAction(null, fd);
                  });
                }}
              >
                <input type="hidden" name="offer_id" value={offerId} />
                <Button type="submit" size="sm" variant="ghost" loading={pending}>
                  {t("console.marketplace.offers.controls.decline", undefined, "Decline")}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
