import { type NextRequest } from "next/server";
import { apiError, apiOk } from "@/lib/api";
import { createServiceClient } from "@/lib/supabase/server";
import { sendPushTo } from "@/lib/push/send";
import { log } from "@/lib/log";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return apiError("unauthorized", "Invalid or missing cron secret");
  }

  const svc = createServiceClient();
  const now = new Date();
  const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  type CredRow = {
    id: string;
    name: string;
    expires_at: string;
    user_id: string;
    org_id: string;
  };

  // Try with revoked_at filter first; fall back if the column doesn't exist.
  let { data, error } = await svc
    .from("credentials")
    .select("id, name, expires_at, user_id, org_id")
    .not("expires_at", "is", null)
    .gt("expires_at", now.toISOString())
    .lte("expires_at", in30.toISOString())
    .is("revoked_at", null);

  if (error && error.message.includes("revoked_at")) {
    log.warn("credential_expiry.revoked_at_missing", { err: error.message });
    ({ data, error } = await svc
      .from("credentials")
      .select("id, name, expires_at, user_id, org_id")
      .not("expires_at", "is", null)
      .gt("expires_at", now.toISOString())
      .lte("expires_at", in30.toISOString()));
  }

  if (error) {
    return apiError("internal", error.message);
  }

  const rows = (data ?? []) as CredRow[];

  let alerted = 0;
  for (const cred of rows) {
    const expiresAt = new Date(cred.expires_at);
    const diffMs = expiresAt.getTime() - now.getTime();
    const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    try {
      await sendPushTo(cred.user_id, {
        title: "Credential Expiring Soon",
        body: `Your ${cred.name} expires in ${daysLeft} day${daysLeft === 1 ? "" : "s"}. Renew it before it lapses.`,
        url: "/m/docs",
        kind: "credential_expiry",
      });
      alerted += 1;
    } catch (err) {
      log.warn("credential_expiry.push_failed", {
        credentialId: cred.id,
        err: (err as Error).message,
      });
    }
  }

  return apiOk({ alerted });
}
