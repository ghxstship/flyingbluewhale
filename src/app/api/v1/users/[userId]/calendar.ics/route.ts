import { z } from "zod";
import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/v1/users/{userId}/calendar.ics — Opportunity #26.
 *
 * Per-user subscribe URL. Emits VCALENDAR with every event across all
 * projects the user is a member of. Authorization is via a
 * `?token=<hex>` (signed at issue time) so a calendar client that
 * doesn't send Supabase cookies can still subscribe. The token is
 * issued at /me/settings/calendar and stored in user_preferences.ics_token.
 *
 * Until that issuance flow lands, we gate on the authenticated
 * session. Subscribing from Google/Apple/Outlook requires the token
 * flow — the endpoint returns 401 otherwise.
 */

const ParamsSchema = z.object({ userId: z.string().uuid() });

const dynamic = "force-dynamic";
export { dynamic };

function fmtIcs(d: string | Date): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

export async function GET(req: Request, ctx: { params: Promise<{ userId: string }> }) {
  const { userId } = await ctx.params;
  const p = ParamsSchema.safeParse({ userId });
  if (!p.success) return apiError("bad_request", "Invalid user id");

  // Phase 1 authorization: require an auth'd Supabase session that matches
  // the path userId. Phase 2 (follow-up) reads a token query param and
  // looks it up against user_preferences.ics_token instead.
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user || auth.user.id !== p.data.userId) {
    return new NextResponse("Unauthorized\n", {
      status: 401,
      headers: { "content-type": "text/plain" },
    });
  }

  // Pull every event across every org the user is a member of.
  const { data: memberships } = await supabase
    .from("memberships")
    .select("org_id")
    .eq("user_id", p.data.userId);
  const orgIds = (memberships ?? []).map((m) => m.org_id);
  if (orgIds.length === 0) {
    return new NextResponse("BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//flyingbluewhale//calendar//EN\r\nEND:VCALENDAR\r\n", {
      headers: { "content-type": "text/calendar; charset=utf-8" },
    });
  }
  const { data: events } = await supabase
    .from("events")
    .select("id, name, description, starts_at, ends_at")
    .in("org_id", orgIds)
    .order("starts_at", { ascending: true })
    .limit(2000);

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//flyingbluewhale//calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];
  for (const e of events ?? []) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${e.id}@flyingbluewhale.app`,
      `DTSTAMP:${fmtIcs(new Date())}`,
      `DTSTART:${fmtIcs(e.starts_at as string)}`,
      `DTEND:${fmtIcs(e.ends_at as string)}`,
      `SUMMARY:${(e.name ?? "").replace(/\r?\n/g, " ")}`,
      ...(e.description ? [`DESCRIPTION:${e.description.replace(/\r?\n/g, "\\n")}`] : []),
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR", "");
  return new NextResponse(lines.join("\r\n"), {
    headers: {
      "content-type": "text/calendar; charset=utf-8",
      "cache-control": "private, max-age=60",
    },
  });
}
