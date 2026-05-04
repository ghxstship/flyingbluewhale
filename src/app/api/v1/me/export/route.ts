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
  "audit_log", // entries where actor_id = me
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
  // Per-table query keeps the typed builder narrowed to the correct columns.
  for (const table of TABLES_USER_SCOPED) {
    try {
      let data: unknown[] = [];
      if (table === "audit_log") {
        const r = await supabase.from("audit_log").select("*").eq("actor_id", userId).limit(10_000);
        data = r.data ?? [];
      } else if (table === "user_preferences") {
        const r = await supabase.from("user_preferences").select("*").eq("user_id", userId).limit(10_000);
        data = r.data ?? [];
      } else if (table === "memberships") {
        const r = await supabase.from("memberships").select("*").eq("user_id", userId).limit(10_000);
        data = r.data ?? [];
      } else if (table === "users") {
        const r = await supabase.from("users").select("*").eq("id", userId).limit(10_000);
        data = r.data ?? [];
      } else if (table === "notifications") {
        const r = await supabase.from("notifications").select("*").eq("user_id", userId).limit(10_000);
        data = r.data ?? [];
      } else if (table === "ai_conversations") {
        const r = await supabase.from("ai_conversations").select("*").limit(10_000);
        data = r.data ?? [];
      } else if (table === "ai_messages") {
        const r = await supabase.from("ai_messages").select("*").limit(10_000);
        data = r.data ?? [];
      } else if (table === "expenses") {
        const r = await supabase.from("expenses").select("*").limit(10_000);
        data = r.data ?? [];
      } else if (table === "time_entries") {
        const r = await supabase.from("time_entries").select("*").limit(10_000);
        data = r.data ?? [];
      } else if (table === "mileage_logs") {
        const r = await supabase.from("mileage_logs").select("*").limit(10_000);
        data = r.data ?? [];
      }
      bundle[table] = data;
    } catch (err) {
      bundle[table] = { error: String(err) };
    }
  }

  return new NextResponse(JSON.stringify(bundle, null, 2), {
    status: 200,
    headers: {
      "content-type": "application/json",
      "content-disposition": `attachment; filename="lytehaus-export-${userId}-${Date.now()}.json"`,
      "cache-control": "no-store",
    },
  });
}
