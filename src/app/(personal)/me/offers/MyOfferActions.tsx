"use client";

import * as React from "react";
import { useActionState } from "react";
import { toast } from "@/lib/hooks/useToast";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { useT } from "@/lib/i18n/LocaleProvider";
import { acceptOfferAction, declineOfferAction, type State } from "./actions";

/**
 * Accept / Decline pair for an open booking offer. Accepting a booking offer
 * is a binding commitment (60% deposit by default), so both decisions open a
 * confirmation sheet: Accept restates fee, deposit, and date before the
 * commitment; Decline offers an optional reason relayed to the buyer
 * (AUDIT C-25). Server-action errors surface as toasts.
 */
export function MyOfferActions({
  offerId,
  actName,
  buyerName,
  feeLabel,
  depositPct,
  balanceLabel,
  dateLabel,
}: {
  offerId: string;
  actName: string;
  buyerName: string;
  feeLabel: string;
  depositPct: number;
  balanceLabel: string;
  dateLabel: string;
}) {
  const t = useT();
  const [acceptState, acceptFormAction, acceptPending] = useActionState<State, FormData>(acceptOfferAction, null);
  const [declineState, declineFormAction, declinePending] = useActionState<State, FormData>(declineOfferAction, null);
  const pending = acceptPending || declinePending;

  const [acceptOpen, setAcceptOpen] = React.useState(false);
  const [declineOpen, setDeclineOpen] = React.useState(false);

  React.useEffect(() => {
    if (acceptState?.error) toast.error(acceptState.error);
    if (acceptState?.ok) setAcceptOpen(false);
  }, [acceptState]);
  React.useEffect(() => {
    if (declineState?.error) toast.error(declineState.error);
    if (declineState?.ok) setDeclineOpen(false);
  }, [declineState]);

  return (
    <div className="flex items-center gap-2">
      <Button type="button" size="sm" disabled={pending} onClick={() => setAcceptOpen(true)}>
        {t("me.offers.actions.accept", undefined, "Accept")}
      </Button>
      <Button type="button" size="sm" variant="ghost" disabled={pending} onClick={() => setDeclineOpen(true)}>
        {t("me.offers.actions.decline", undefined, "Decline")}
      </Button>

      {/* Accept confirmation — restates the terms being committed to. */}
      <Dialog open={acceptOpen} onOpenChange={(o) => !acceptPending && setAcceptOpen(o)}>
        <DialogContent size="sm" role="alertdialog">
          <DialogHeader>
            <DialogTitle>{t("me.offers.confirm.acceptTitle", undefined, "Accept this offer?")}</DialogTitle>
            <DialogDescription>
              {t(
                "me.offers.confirm.acceptBody",
                { actName, buyerName, feeLabel, dateLabel },
                `${actName} performs for ${buyerName} on ${dateLabel} for ${feeLabel}.`,
              )}
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-[var(--p-text-2)]">
            {t(
              "me.offers.confirm.acceptTerms",
              { pct: depositPct, balance: balanceLabel },
              `Accepting commits you to these terms: ${depositPct}% deposit on signature, ${balanceLabel}.`,
            )}
          </p>
          <DialogFooter>
            <Button type="button" variant="ghost" disabled={acceptPending} onClick={() => setAcceptOpen(false)}>
              {t("common.cancel", undefined, "Cancel")}
            </Button>
            <form action={acceptFormAction}>
              <input type="hidden" name="offer_id" value={offerId} />
              <Button type="submit" size="sm" loading={acceptPending} disabled={pending}>
                {t("me.offers.confirm.acceptCta", undefined, "Accept Offer")}
              </Button>
            </form>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Decline sheet — optional reason relayed to the buyer. */}
      <Dialog open={declineOpen} onOpenChange={(o) => !declinePending && setDeclineOpen(o)}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>{t("me.offers.confirm.declineTitle", undefined, "Decline this offer?")}</DialogTitle>
            <DialogDescription>
              {t(
                "me.offers.confirm.declineBody",
                { actName, buyerName, dateLabel },
                `Turn down ${buyerName}'s offer for ${actName} on ${dateLabel}. They'll be notified.`,
              )}
            </DialogDescription>
          </DialogHeader>
          <form action={declineFormAction} className="space-y-3">
            <input type="hidden" name="offer_id" value={offerId} />
            <div>
              <label htmlFor={`decline-reason-${offerId}`} className="text-xs font-medium text-[var(--p-text-2)]">
                {t("me.offers.confirm.reasonLabel", undefined, "Reason (optional)")}
              </label>
              <textarea
                id={`decline-reason-${offerId}`}
                name="reason"
                rows={3}
                maxLength={500}
                className="ps-input mt-1.5 w-full"
                placeholder={t(
                  "me.offers.confirm.reasonPlaceholder",
                  undefined,
                  "Already booked that night, fee doesn't work, etc.",
                )}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" disabled={declinePending} onClick={() => setDeclineOpen(false)}>
                {t("common.cancel", undefined, "Cancel")}
              </Button>
              <Button type="submit" size="sm" variant="danger" loading={declinePending} disabled={pending}>
                {t("me.offers.confirm.declineCta", undefined, "Decline Offer")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
