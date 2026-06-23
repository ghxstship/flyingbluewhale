"use client";

import { useState } from "react";

/**
 * Buy control for a credit pack. POSTs to the credits-checkout API and
 * forwards to the returned Stripe Checkout URL.
 */
export function BuyButton({ productId, label }: { productId: string; label: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buy = async () => {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/stripe/credits-checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ creditProductId: productId }),
      });
      const json = (await res.json()) as { data?: { checkoutUrl?: string }; error?: { message?: string } };
      if (!res.ok || !json.data?.checkoutUrl) {
        setError(json.error?.message ?? "Checkout unavailable");
        setPending(false);
        return;
      }
      window.location.href = json.data.checkoutUrl;
    } catch {
      setError("Network error");
      setPending(false);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <button type="button" onClick={buy} disabled={pending} className="ps-btn ps-btn--cta" style={{ minHeight: 44, justifyContent: "center" }}>
        {pending ? "…" : label}
      </button>
      {error && (
        <p className="text-xs text-[var(--p-danger)]" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
