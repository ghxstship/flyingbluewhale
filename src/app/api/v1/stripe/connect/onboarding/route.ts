import { z } from "zod";
import { apiError, apiOk, parseJson } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { env } from "@/lib/env";

const Schema = z.object({
  vendorId: z.string().uuid(),
  returnUrl: z.string().url().optional(),
});

/**
 * Kick off Stripe Connect Express onboarding for a vendor.
 * Implementation creates an Account + AccountLink via Stripe REST; we call it
 * with fetch() directly so we don't pull in the full `stripe` SDK.
 */
export async function POST(req: Request) {
  if (!env.STRIPE_SECRET_KEY) return apiError("internal", "STRIPE_SECRET_KEY is not configured");
  const input = await parseJson(req, Schema);
  if (input instanceof Response) return input;

  return withAuth(async () => {
    const appUrl = env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const acctForm = new URLSearchParams();
    acctForm.set("type", "express");
    acctForm.set("capabilities[transfers][requested]", "true");

    const acctRes = await fetch("https://api.stripe.com/v1/accounts", {
      method: "POST",
      headers: {
        "authorization": `Bearer ${env.STRIPE_SECRET_KEY}`,
        "content-type": "application/x-www-form-urlencoded",
      },
      body: acctForm.toString(),
    });
    if (!acctRes.ok) return apiError("internal", `Stripe account: ${await acctRes.text()}`);
    const acct = (await acctRes.json()) as { id: string };

    const linkForm = new URLSearchParams();
    linkForm.set("account", acct.id);
    linkForm.set("refresh_url", `${appUrl}/console/procurement/vendors/${input.vendorId}?onboarding=refresh`);
    linkForm.set("return_url", input.returnUrl ?? `${appUrl}/console/procurement/vendors/${input.vendorId}?onboarding=done`);
    linkForm.set("type", "account_onboarding");

    const linkRes = await fetch("https://api.stripe.com/v1/account_links", {
      method: "POST",
      headers: {
        "authorization": `Bearer ${env.STRIPE_SECRET_KEY}`,
        "content-type": "application/x-www-form-urlencoded",
      },
      body: linkForm.toString(),
    });
    if (!linkRes.ok) return apiError("internal", `Stripe account_link: ${await linkRes.text()}`);
    const link = (await linkRes.json()) as { url: string };

    return apiOk({ connectAccountId: acct.id, onboardingUrl: link.url });
  });
}
