export const dynamic = "force-dynamic";

import { PortalSubpage } from "@/components/PortalSubpage";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { projectIdFromSlug } from "@/lib/db/advancing";
import { fmtDateTime } from "@/components/detail/DetailShell";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await requireSession();
  const project = await projectIdFromSlug(slug);
  const supabase = await createClient();
  let rows: Array<{ id: string; description: string | null; started_at: string; ended_at: string | null; duration_minutes: number | null; billable: boolean }> = [];
  if (project) {
    const { data } = await supabase
      .from("time_entries")
      .select("id, description, started_at, ended_at, duration_minutes, billable")
      .eq("project_id", project.id)
      .eq("user_id", session.userId)
      .order("started_at", { ascending: false });
    rows = (data ?? []) as typeof rows;
  }
  return (
    <PortalSubpage slug={slug} persona="crew" title="Time" subtitle="Your time entries for this project">
      {rows.length === 0 ? (
        <EmptyState title="No time logged yet" description="Clock in and out from the mobile PWA or the console Time module." />
      ) : (
        <table className="data-table w-full text-sm">
          <thead><tr><th>Started</th><th>Ended</th><th>Hours</th><th>Billable</th><th>Notes</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="font-mono text-xs">{fmtDateTime(r.started_at)}</td>
                <td className="font-mono text-xs">{fmtDateTime(r.ended_at)}</td>
                <td className="font-mono text-xs">{r.duration_minutes != null ? Math.round(r.duration_minutes / 60 * 10) / 10 : "—"}</td>
                <td>{r.billable ? "Yes" : "No"}</td>
                <td className="text-[var(--text-muted)]">{r.description ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </PortalSubpage>
  );
}
