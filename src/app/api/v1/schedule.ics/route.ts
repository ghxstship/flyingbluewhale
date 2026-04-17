import { apiError } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

function pad(n: number) { return n.toString().padStart(2, "0"); }
function toIcsDate(s: string) {
  const d = new Date(s);
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth()+1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}

export async function GET() {
  return withAuth(async (session) => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("events")
      .select("id,name,starts_at,ends_at,description")
      .eq("org_id", session.orgId)
      .order("starts_at", { ascending: true });
    if (error) return apiError("internal", error.message);

    const lines: string[] = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//flyingbluewhale//EN",
    ];
    for (const ev of data ?? []) {
      lines.push(
        "BEGIN:VEVENT",
        `UID:${ev.id}@flyingbluewhale`,
        `DTSTAMP:${toIcsDate(new Date().toISOString())}`,
        `DTSTART:${toIcsDate(ev.starts_at)}`,
        `DTEND:${toIcsDate(ev.ends_at)}`,
        `SUMMARY:${ev.name.replace(/[,;]/g, " ")}`,
        ...(ev.description ? [`DESCRIPTION:${ev.description.replace(/\n/g, "\\n").replace(/[,;]/g, " ")}`] : []),
        "END:VEVENT",
      );
    }
    lines.push("END:VCALENDAR");

    return new Response(lines.join("\r\n"), {
      headers: { "content-type": "text/calendar; charset=utf-8", "content-disposition": 'attachment; filename="schedule.ics"' },
    });
  });
}
