// Supabase Edge Function — runs on a daily cron.
// Permanently deletes any user whose `deleted_at <= now()`, plus their
// memberships and (cascading) all org-scoped data they own.
//
// Schedule: 03:00 UTC daily.
// SECURITY: requires service-role key. Auth via Authorization: Bearer ${ANON} only
// allowed if Vercel cron — for safety we additionally require an x-purge-token
// matching the env secret.

// @ts-expect-error — Deno runtime imports
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

declare const Deno: { env: { get: (k: string) => string | undefined }; serve: (h: (req: Request) => Response | Promise<Response>) => void };

Deno.serve(async (req: Request) => {
  // Token gate
  const expected = Deno.env.get("PURGE_TOKEN");
  const provided = req.headers.get("x-purge-token");
  if (!expected || provided !== expected) {
    return new Response(JSON.stringify({ ok: false, error: "forbidden" }), {
      status: 403,
      headers: { "content-type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ ok: false, error: "missing env" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  const nowIso = new Date().toISOString();

  // 1. Pull due users
  const { data: due, error: dueErr } = await supabase
    .from("users")
    .select("id")
    .lte("deleted_at", nowIso);

  if (dueErr) {
    return new Response(JSON.stringify({ ok: false, error: dueErr.message }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }

  const purged: string[] = [];
  const failed: Array<{ id: string; error: string }> = [];

  for (const row of due ?? []) {
    const userId = (row as { id: string }).id;
    try {
      // CASCADE deletes via FK relations; any straggler rows scoped by user_id are removed
      // by cascading from public.users (FK) and auth.users (separate delete below).
      const { error: pubErr } = await supabase
        .from("users")
        .delete()
        .eq("id", userId);
      if (pubErr) throw pubErr;

      // Hard-delete from auth.users (admin API)
      const { error: authErr } = await supabase.auth.admin.deleteUser(userId);
      if (authErr) throw authErr;

      purged.push(userId);
    } catch (e) {
      failed.push({ id: userId, error: e instanceof Error ? e.message : String(e) });
    }
  }

  return new Response(
    JSON.stringify({
      ok: true,
      purgedCount: purged.length,
      failedCount: failed.length,
      failed,
      ranAt: nowIso,
    }),
    { status: 200, headers: { "content-type": "application/json" } },
  );
});
