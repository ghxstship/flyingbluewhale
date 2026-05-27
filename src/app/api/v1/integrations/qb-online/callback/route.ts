import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { exchangeAuthCode } from "@/lib/accounting/qb-online";
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

    // Verify state matches the caller's org.
    if (parsed.data.state !== session.orgId) {
      return apiError("forbidden", "OAuth state / session mismatch");
    }

    const redirectUri = `${url.origin}/api/v1/integrations/qb-online/callback`;
    const tokens = await exchangeAuthCode(parsed.data.code, parsed.data.realmId, redirectUri);
    if ("error" in tokens) {
      log.error("qbo.oauth_callback_failed", { err: tokens.error });
      return apiError("internal", tokens.error);
    }

    // Persist via the service role; the auth payload is encrypted at
    // rest via Supabase Vault later. For now we store the token JSON
    // base64'd into auth_ciphertext with a placeholder key_ref — the
    // server-side worker reads + writes only.
    const svc = createServiceClient() as unknown as LooseSupabase;
    const payload = Buffer.from(JSON.stringify(tokens)).toString("base64");

    await svc.from("accounting_connections").upsert(
      {
        org_id: session.orgId,
        system: "qb_online",
        tenant_id: tokens.realm_id,
        display_name: `QuickBooks Online (${tokens.realm_id})`,
        auth_ciphertext: payload,
        auth_key_ref: "env_base64_placeholder",
        connection_state: "connected",
        created_by: session.userId,
        last_sync_at: null,
      },
      { onConflict: "org_id,system,tenant_id" },
    );

    return NextResponse.redirect(`${url.origin}/console/settings/integrations/accounting?qb_connected=1`, 302);
  });
}
