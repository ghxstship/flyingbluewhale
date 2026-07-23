import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { createClient } from "@/lib/supabase/server";
import { keyFromRequest, ratelimit, RATE_BUDGETS } from "@/lib/ratelimit";
import { log } from "@/lib/log";
import { emitAudit } from "@/lib/audit";

/**
 * GDPR data export endpoint. Returns a JSON bundle of every row in the
 * public schema where the user is the actor or owner.
 *
 * P1 hardening (docs/HARDENING_AUDIT.md):
 *   • All per-table queries run in parallel via Promise.all — was
 *     sequential await in a `for ... of` loop (blocked ~3-5s on a
 *     fresh DSAR request).
 *   • Per-table errors are LOGGED (not silently dropped) and the
 *     bundle includes a `_errors` summary so the user knows what's
 *     incomplete. Production deploys should treat any error as a
 *     500 (option via `?strict=1`) or alert via the log namespace.
 *   • New XPMS / the deskless-workforce suite / marketplace tables are included so the
 *     export reflects every PII-bearing surface the user has touched.
 *
 * Audit-logged via the SSOT trigger (the read itself isn't logged; the
 * request gets a request_id via middleware so any subsequent action is
 * correlated).
 */
type Probe = { table: string; data: unknown[] | null; error: string | null };

async function probe<T>(
  table: string,
  q: PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
): Promise<Probe> {
  try {
    const r = await q;
    if (r.error) {
      log.warn("dsar_export.table_error", { table, err: r.error.message });
      return { table, data: null, error: r.error.message };
    }
    return { table, data: r.data ?? [], error: null };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    log.warn("dsar_export.table_exception", { table, err: msg });
    return { table, data: null, error: msg };
  }
}

export async function GET(req: Request) {
  // ~20-table parallel dump — use the heavy-generator budget so a
  // refresh-spam loop can't hammer the DB (GDPR contract is ~1/day).
  const rl = await ratelimit({ key: keyFromRequest(req, "me-export"), ...RATE_BUDGETS.export });
  if (!rl.ok) return apiError("rate_limited", "Export requests are limited. Try again in a minute.");

  const supabase = await createClient();
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData.user) {
    return apiError("unauthorized", "Sign in to export your data");
  }
  const userId = userData.user.id;
  const strict = new URL(req.url).searchParams.get("strict") === "1";

  // Pre-fetch conversation ids so the ai_messages query can fan out
  // alongside the rest (ai_messages has no user_id column).
  const { data: convoRows } = await supabase.from("ai_conversations").select("id").eq("user_id", userId).limit(10_000);
  const userConversationIds: string[] = (convoRows ?? []).map((r) => r.id);

  // Identity + access surfaces.
  // Activity / event log surfaces.
  // XPMS / finance surfaces — anything where submitter_id / created_by / user_id keys to the user.
  // Workforce parity surfaces — kudos sent/received, time-off, courses, badges, docs.
  // Marketplace surfaces — applications, submissions, offers, reviews, talent profile.
  const probes: Promise<Probe>[] = [
    probe("users", supabase.from("users").select("*").eq("id", userId).limit(10_000)),
    probe("user_preferences", supabase.from("user_preferences").select("*").eq("user_id", userId).limit(10_000)),
    probe("memberships", supabase.from("memberships").select("*").eq("user_id", userId).limit(10_000)),
    probe("audit_log", supabase.from("audit_log").select("*").eq("actor_id", userId).limit(10_000)),
    probe("notifications", supabase.from("notifications").select("*").eq("user_id", userId).limit(10_000)),
    probe("ai_conversations", supabase.from("ai_conversations").select("*").eq("user_id", userId).limit(10_000)),
    probe("expenses", supabase.from("expenses").select("*").eq("submitter_id", userId).limit(10_000)),
    probe("time_entries", supabase.from("time_entries").select("*").eq("user_id", userId).limit(10_000)),
    probe("mileage_logs", supabase.from("mileage_logs").select("*").eq("user_id", userId).limit(10_000)),
    // ai_messages: only if the user owns at least one conversation
    userConversationIds.length === 0
      ? Promise.resolve({ table: "ai_messages", data: [], error: null } as Probe)
      : probe(
          "ai_messages",
          supabase.from("ai_messages").select("*").in("conversation_id", userConversationIds).limit(10_000),
        ),
    // Workforce parity surfaces (CLAUDE.md §"Workforce parity (0046–0048)").
    // Failures land in _errors.
    probe("announcement_reads", supabase.from("announcement_reads").select("*").eq("user_id", userId).limit(10_000)),
    probe("chat_messages", supabase.from("chat_messages").select("*").eq("author_id", userId).limit(10_000)),
    probe("personal_documents", supabase.from("personal_documents").select("*").eq("user_id", userId).limit(10_000)),
    probe(
      "recognition_posts_sent",
      supabase.from("recognition_posts").select("*").eq("from_user_id", userId).limit(10_000),
    ),
    probe(
      "recognition_posts_received",
      supabase.from("recognition_posts").select("*").eq("to_user_id", userId).limit(10_000),
    ),
    probe("time_off_requests", supabase.from("time_off_requests").select("*").eq("user_id", userId).limit(10_000)),
    probe(
      "course_assignments",
      supabase.from("course_assignments").select("*").eq("assignee_id", userId).limit(10_000),
    ),
    probe("badge_awards", supabase.from("badge_awards").select("*").eq("user_id", userId).limit(10_000)),
    // Marketplace + crew surfaces — Art. 15 categories the prior export
    // missed: the user's public-facing profiles, the records where they are
    // a party, and reviews about/by them.
    probe("crew_members", supabase.from("crew_members").select("*").eq("user_id", userId).limit(10_000)),
    probe("talent_profiles", supabase.from("talent_profiles").select("*").eq("user_id", userId).limit(10_000)),
    probe("user_profiles", supabase.from("user_profiles").select("*").eq("user_id", userId).limit(10_000)),
    probe("assignments", supabase.from("assignments").select("*").eq("party_user_id", userId).limit(10_000)),
    probe("reviews_written", supabase.from("reviews").select("*").eq("reviewer_user_id", userId).limit(10_000)),
    probe("reviews_received", supabase.from("reviews").select("*").eq("subject_user_id", userId).limit(10_000)),
    probe("job_applications", supabase.from("job_applications").select("*").eq("applicant_user_id", userId).limit(10_000)),
    probe(
      "open_call_submissions",
      supabase.from("open_call_submissions").select("*").eq("submitter_user_id", userId).limit(10_000),
    ),
    probe("availability_slots", supabase.from("availability_slots").select("*").eq("user_id", userId).limit(10_000)),
    probe("saved_searches", supabase.from("saved_searches").select("*").eq("user_id", userId).limit(10_000)),
  ];

  const results = await Promise.all(probes);

  const bundle: Record<string, unknown> = {
    exportedAt: new Date().toISOString(),
    user: {
      id: userId,
      email: userData.user.email,
      created_at: userData.user.created_at,
    },
  };
  const errors: Record<string, string> = {};
  for (const r of results) {
    bundle[r.table] = r.data ?? [];
    if (r.error) errors[r.table] = r.error;
  }
  if (Object.keys(errors).length > 0) {
    bundle._errors = errors;
    if (strict) {
      return apiError("internal", `DSAR export incomplete: ${Object.keys(errors).length} table(s) failed`);
    }
  }

  // GDPR Art. 15/20 — the data export is one of the most litigation-relevant
  // self-service actions; audit it. The export endpoint has no session/orgId
  // (it authorizes on the bearer user alone), so resolve the user's primary
  // active org for the org-scoped audit_log row. Best-effort: an audit miss
  // must never block the export.
  const { data: membership } = await supabase
    .from("memberships")
    .select("org_id")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (membership?.org_id) {
    await emitAudit({
      actorId: userId,
      orgId: membership.org_id,
      actorEmail: userData.user.email ?? null,
      action: "privacy.data_export",
      targetTable: "users",
      targetId: userId,
      metadata: {
        tables: results.map((r) => r.table),
        partial: Object.keys(errors).length > 0,
      },
    });
  }

  return new NextResponse(JSON.stringify(bundle, null, 2), {
    status: 200,
    headers: {
      "content-type": "application/json",
      "content-disposition": `attachment; filename="atlvs-export-${userId}-${Date.now()}.json"`,
      "cache-control": "no-store",
    },
  });
}
