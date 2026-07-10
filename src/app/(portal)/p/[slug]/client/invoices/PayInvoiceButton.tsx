"use client";

import { useState } from "react";
import { useT } from "@/lib/i18n/LocaleProvider";

/**
 * Pay button for an open client invoice (C-07). Posts to the existing
 * /api/v1/stripe/checkout endpoint (payer path) and hands the browser to
 * Stripe Checkout. Errors surface inline, consumer-grade.
 */
export function PayInvoiceButton({ invoiceId, slug, number }: { invoiceId: string; slug: string; number: string }) {
  const t = useT();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/stripe/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ invoiceId, portalSlug: slug }),
      });
      const json = (await res.json().catch(() => null)) as { data?: { checkoutUrl?: string } } | null;
      const url = json?.data?.checkoutUrl;
      if (!res.ok || !url) {
        setError(
          t(
            "p.client.invoices.pay.error",
            undefined,
            "We couldn't start the payment. Try again, or message your producer.",
          ),
        );
        setBusy(false);
        return;
      }
      window.location.assign(url);
    } catch {
      setError(
        t(
          "p.client.invoices.pay.error",
          undefined,
          "We couldn't start the payment. Try again, or message your producer.",
        ),
      );
      setBusy(false);
    }
  }

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={startCheckout}
        disabled={busy}
        className="ps-btn ps-btn--sm ps-btn--cta"
        aria-label={t("p.client.invoices.pay.aria", { number }, `Pay invoice ${number}`)}
      >
        {busy
          ? t("p.client.invoices.pay.busy", undefined, "Opening checkout…")
          : t("p.client.invoices.pay.label", undefined, "Pay")}
      </button>
      {error && (
        <span role="alert" className="text-[11px] text-[var(--p-danger-text)]">
          {error}
        </span>
      )}
    </span>
  );
}
