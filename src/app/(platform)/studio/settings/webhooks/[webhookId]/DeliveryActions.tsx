"use client";

import * as React from "react";
import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { useT } from "@/lib/i18n/LocaleProvider";
import {
  sendTestEventAction,
  redeliverLastAction,
  type DeliveryActionState,
} from "./actions";

/**
 * F-11 console DX — "Send test event" + "Redeliver last" for one webhook
 * endpoint. Both fire a synchronous signed delivery server-side and land a
 * webhook_deliveries row, so the Recent Deliveries table below refreshes
 * with the result; the inline status line gives the immediate verdict.
 */
export function DeliveryActions({ endpointId, hasDeliveries }: { endpointId: string; hasDeliveries: boolean }) {
  const t = useT();
  const [testState, testAction, testPending] = useActionState<DeliveryActionState, FormData>(
    sendTestEventAction,
    null,
  );
  const [redeliverState, redeliverAction, redeliverPending] = useActionState<DeliveryActionState, FormData>(
    redeliverLastAction,
    null,
  );
  const state = testState ?? redeliverState;
  const pending = testPending || redeliverPending;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <form action={testAction}>
        <input type="hidden" name="endpointId" value={endpointId} />
        <Button type="submit" variant="secondary" size="sm" disabled={pending}>
          {testPending
            ? t("console.settings.webhooks.detail.sendingTest", undefined, "Sending…")
            : t("console.settings.webhooks.detail.sendTest", undefined, "Send test event")}
        </Button>
      </form>
      {hasDeliveries && (
        <form action={redeliverAction}>
          <input type="hidden" name="endpointId" value={endpointId} />
          <Button type="submit" variant="secondary" size="sm" disabled={pending}>
            {redeliverPending
              ? t("console.settings.webhooks.detail.redelivering", undefined, "Redelivering…")
              : t("console.settings.webhooks.detail.redeliverLast", undefined, "Redeliver last")}
          </Button>
        </form>
      )}
      {state && (
        <span
          className={`text-xs ${state.ok ? "text-[var(--p-success-text)]" : "text-[var(--p-danger-text)]"}`}
          role="status"
        >
          {state.message}
        </span>
      )}
    </div>
  );
}
