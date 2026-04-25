import { apiError, apiOk } from "@/lib/api";
import { assertCapability, withAuth } from "@/lib/auth";
import { env } from "@/lib/env";
import { createClient, isServiceClientAvailable } from "@/lib/supabase/server";
import { httpFetch } from "@/lib/http";

/**
 * POST /api/v1/stripe/portal
 *
 * Mints a Stripe Billing Portal session for the current org and returns
 * its URL. The page client redirects there. Owners/admins only.
 *
 * Requires the org to already have a `stripe_customer_id` (set during the
 * first invoice checkout). If absent, returns 409 — the caller should
 * complete one billable transaction first.
 */
export async function POST() {
  return withAuth(async (session) => {
    const denial = assertCapability(session, "billing:write");
    if (denial) return denial;
    if (!env.STRIPE_SECRET_KEY) {
      return apiError("service_unavailable", "STRIPE_SECRET_KEY is not configured");
    }
    if (!isServiceClientAvailable()) {
      return apiError("service_unavailable", "This endpoint requires SUPABASE_SERVICE_ROLE_KEY");
    }
    const supabase = await createClient();
    const { data: org } = await supabase
      .from("orgs")
      .select("stripe_customer_id, name")
      .eq("id", session.orgId)
      .maybeSingle();
    let customerId = (org as { stripe_customer_id?: string | null } | null)?.stripe_customer_id ?? null;

    // Lazy customer creation. The portal needs a real customer ID; if the
    // org hasn't transacted yet, create one so the portal opens with a
    // clean payment-method form rather than 409'ing.
    if (!customerId) {
      const create = new URLSearchParams();
      create.set("email", session.email);
      create.set("name", (org as { name?: string } | null)?.name ?? "");
      create.set("metadata[org_id]", session.orgId);
      const res = await httpFetch("https://api.stripe.com/v1/customers", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: create.toString(),
      });
      if (!res.ok) {
        const text = await res.text();
        return apiError("internal", `Stripe customer create failed: ${text}`);
      }
      const created = (await res.json()) as { id: string };
      customerId = created.id;
      await supabase.from("orgs").update({ stripe_customer_id: customerId }).eq("id", session.orgId);
    }

    const appUrl = env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const form = new URLSearchParams();
    form.set("customer", customerId);
    form.set("return_url", `${appUrl}/console/settings/billing`);
    const res = await httpFetch("https://api.stripe.com/v1/billing_portal/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
    });
    if (!res.ok) {
      const text = await res.text();
      return apiError("internal", `Stripe error: ${text}`);
    }
    const json = (await res.json()) as { url: string };
    return apiOk({ url: json.url });
  });
}
