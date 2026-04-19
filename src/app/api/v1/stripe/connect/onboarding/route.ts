import { z } from "zod";
import { apiError, apiOk, parseJson } from "@/lib/api";
import { assertCapability, withAuth } from "@/lib/auth";
import { env } from "@/lib/env";
import { httpFetch } from "@/lib/http";
import { withIdempotency } from "@/lib/idempotency";

const Schema = z.object({
  vendorId: z.string().uuid(),
  returnUrl: z.string().url().optional(),
});

async function handler(req: Request) {
  const input = await parseJson(req, Schema);
  if (input instanceof Response) return input;

  return withAuth(async (session) => {
    // Kicking off a Stripe Connect onboarding is a payouts action. Only
    // controller/owner/admin can bind a vendor to a bank account. Gate
    // BEFORE the Stripe env check so an unprivileged caller doesn't learn
    // whether secrets are configured.
    const denial = assertCapability(session, "payouts:write");
    if (denial) return denial;
    if (!env.STRIPE_SECRET_KEY) return apiError("internal", "STRIPE_SECRET_KEY is not configured");
    const appUrl = env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const acctForm = new URLSearchParams();
    acctForm.set("type", "express");
    acctForm.set("capabilities[transfers][requested]", "true");

    const acctRes = await httpFetch("https://api.stripe.com/v1/accounts", {
      method: "POST",
      headers: {
        "authorization": `Bearer ${env.STRIPE_SECRET_KEY}`,
        "content-type": "application/x-www-form-urlencoded",
      },
      body: acctForm.toString(),
      timeoutMs: 10000,
    });
    if (!acctRes.ok) return apiError("internal", `Stripe account: ${await acctRes.text()}`);
    const acct = (await acctRes.json()) as { id: string };

    const linkForm = new URLSearchParams();
    linkForm.set("account", acct.id);
    linkForm.set("refresh_url", `${appUrl}/console/procurement/vendors/${input.vendorId}?onboarding=refresh`);
    linkForm.set("return_url", input.returnUrl ?? `${appUrl}/console/procurement/vendors/${input.vendorId}?onboarding=done`);
    linkForm.set("type", "account_onboarding");

    const linkRes = await httpFetch("https://api.stripe.com/v1/account_links", {
      method: "POST",
      headers: {
        "authorization": `Bearer ${env.STRIPE_SECRET_KEY}`,
        "content-type": "application/x-www-form-urlencoded",
      },
      body: linkForm.toString(),
      timeoutMs: 10000,
    });
    if (!linkRes.ok) return apiError("internal", `Stripe account_link: ${await linkRes.text()}`);
    const link = (await linkRes.json()) as { url: string };

    return apiOk({ connectAccountId: acct.id, onboardingUrl: link.url });
  });
}

export const POST = withIdempotency(handler as (req: import("next/server").NextRequest) => Promise<Response>);
