"use client";

import * as React from "react";
import { useActionState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { useT } from "@/lib/i18n/LocaleProvider";
import { acceptOfferAction, declineOfferAction, type State } from "./actions";

/**
 * Accept / Decline pair for an open booking offer. Client island so the
 * server-action result surfaces as a toast instead of disappearing —
 * mirrors the DecideTimeOffButtons pattern.
 */
export function MyOfferActions({ offerId }: { offerId: string }) {
  const t = useT();
  const [acceptState, acceptFormAction, acceptPending] = useActionState<State, FormData>(acceptOfferAction, null);
  const [declineState, declineFormAction, declinePending] = useActionState<State, FormData>(declineOfferAction, null);
  const pending = acceptPending || declinePending;

  React.useEffect(() => {
    if (acceptState?.error) toast.error(acceptState.error);
  }, [acceptState]);
  React.useEffect(() => {
    if (declineState?.error) toast.error(declineState.error);
  }, [declineState]);

  return (
    <div className="flex items-center gap-2">
      <form action={acceptFormAction}>
        <input type="hidden" name="offer_id" value={offerId} />
        <Button type="submit" size="sm" loading={acceptPending} disabled={pending}>
          {t("me.offers.actions.accept", undefined, "Accept")}
        </Button>
      </form>
      <form action={declineFormAction}>
        <input type="hidden" name="offer_id" value={offerId} />
        <Button type="submit" size="sm" variant="ghost" loading={declinePending} disabled={pending}>
          {t("me.offers.actions.decline", undefined, "Decline")}
        </Button>
      </form>
    </div>
  );
}
