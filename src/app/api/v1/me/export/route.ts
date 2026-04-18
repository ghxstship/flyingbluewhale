import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { createClient } from "@/lib/supabase/server";

/**
 * GDPR data export endpoint. Returns a JSON bundle of every row in the public
 * schema where the user is the actor or owner. Streams nothing — just JSON.
 *
 * Audit-logged via the SSOT trigger (the read itself isn't logged; the request
 * gets a request_id via middleware so any subsequent action is correlated).
 */
const TABLES_USER_SCOPED = [
  "users",
  "user_preferences",
  "memberships",
  "ai_conversations",
  "ai_messages",
  "audit_log",            // entries where actor_id = me
  "notifications",
  "expenses",
  "time_entries",
  "mileage_logs",
] as const;

export async function GET() {
  const supabase = await createClient();
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData.user) {
    return apiError("unauthorized", "Sign in to export your data");
  }
  const userId = userData.user.id;
  const bundle: Record<string, unknown> = {
    exportedAt: new Date().toISOString(),
    user: {
      id: userId,
      email: userData.user.email,
      created_at: userData.user.created_at,
    },
  };

  // Each table is queried under RLS; the user only gets rows they're entitled to.
  // For audit_log we additionally narrow to actor_id = me.
  for (const table of TABLES_USER_SCOPED) {
    try {
      const tbl = table as string;
      let query = (supabase.from as (t: string) => ReturnType<typeof supabase.from>)(tbl).select("*");
      if (table === "audit_log") query = query.eq("actor_id", userId);
      if (table === "user_preferences") query = query.eq("user_id", userId);
      if (table === "memberships") query = query.eq("user_id", userId);
      if (table === "users") query = query.eq("id", userId);
      if (table === "notifications") query = query.eq("user_id", userId);
      const { data } = await query.limit(10_000);
      bundle[table] = data ?? [];
    } catch (err) {
      bundle[table] = { error: String(err) };
    }
  }

  return new NextResponse(JSON.stringify(bundle, null, 2), {
    status: 200,
    headers: {
      "content-type": "application/json",
      "content-disposition": `attachment; filename="flyingbluewhale-export-${userId}-${Date.now()}.json"`,
      "cache-control": "no-store",
    },
  });
}
