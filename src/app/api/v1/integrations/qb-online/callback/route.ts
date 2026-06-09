import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { createServiceClient, isServiceClientAvailable } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { exchangeAuthCode } from "@/lib/accounting/qb-online";
import { verifyOAuthState } from "@/lib/integrations/slack/sign";
import { sealTokens } from "@/lib/integrations/token-vault";
import { urlFor } from "@/lib/urls";
import { log } from "@/lib/log";

const QuerySchema = z.object({
  code: z.string().min(1),
  state: z.string().min(1),
  realmId: z.string().min(1),
});

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  return withAuth(async (session) => {
    const url = new URL(req.url);
    const parsed = QuerySchema.safeParse({
      code: url.searchParams.get("code") ?? "",
      state: url.searchParams.get("state") ?? "",
      realmId: url.searchParams.get("realmId") ?? "",
    });
    if (!parsed.success) return apiError("bad_request", parsed.error.issues[0]?.message ?? "Invalid callback");

    // Verify the HMAC-signed state: signature, expiry, and that the
    // embedded orgId matches the session's active org. Defeats
    // connection-binding CSRF (attacker-initiated consent replayed
    // against a victim admin's session).
    const clientSecret = process.env.QB_CLIENT_SECRET;
    if (!clientSecret) return apiError("service_unavailable", "QB_CLIENT_SECRET not configured");
    const state = verifyOAuthState({ secret: clientSecret, state: parsed.data.state });
    if (!state || state.orgId !== session.orgId) {
      return apiError("forbidden", "OAuth state / session mismatch");
    }

    const redirectUri = `${url.origin}/api/v1/integrations/qb-online/callback`;
    const tokens = await exchangeAuthCode(parsed.data.code, parsed.data.realmId, redirectUri);
    if ("error" in tokens) {
      log.error("qbo.oauth_callback_failed", { err: tokens.error });
      return apiError("internal", "QuickBooks token exchange failed");
    }

    // Persist via the service role. Tokens are sealed with the AES-GCM
    // token vault (INTEGRATION_TOKEN_KEY) — never bare base64 in prod.
    if (!isServiceClientAvailable()) {
      return apiError(
        "service_unavailable",
        "This endpoint requires SUPABASE_SERVICE_ROLE_KEY in the runtime environment.",
      );
    }
    const svc = createServiceClient() as unknown as LooseSupabase;
    const sealed = sealTokens(tokens);

    const { error: upsertErr } = await svc.from("accounting_connections").upsert(
      {
        org_id: session.orgId,
        system: "qb_online",
        tenant_id: tokens.realm_id,
        display_name: `QuickBooks Online (${tokens.realm_id})`,
        auth_ciphertext: sealed.ciphertext,
        auth_key_ref: sealed.keyRef,
        connection_state: "connected",
        created_by: session.userId,
        last_sync_at: null,
      },
      { onConflict: "org_id,system,tenant_id" },
    );
    if (upsertErr) {
      log.error("qbo.connection_persist_failed", { err: upsertErr.message });
      return apiError("internal", "Could not persist the QuickBooks connection");
    }

    return NextResponse.redirect(urlFor("platform", "/settings/integrations/accounting?qb_connected=1"), 302);
  });
}
