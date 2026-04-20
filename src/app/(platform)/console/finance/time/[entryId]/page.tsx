export const dynamic = "force-dynamic";

import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DetailShell, money, fmtDate } from "@/components/detail/DetailShell";
import { fmtDateTime } from "@/components/detail/DetailShell";

export default async function Page({ params }: { params: Promise<{ entryId: string }> }) {
  const { entryId } = await params;
  const session = await requireSession();
  const supabase = await createClient();
  const { data: row } = await supabase
    .from("time_entries")
    .select("id, description, started_at, ended_at, duration_minutes, billable, project_id, user_id")
    .eq("org_id", session.orgId)
    .eq("id", entryId)
    .maybeSingle();
  return (
    <DetailShell
      row={row}
      eyebrow="Finance"
      title={(r) => r.description ?? "Time entry"}
      subtitle={(r) => r.duration_minutes ? `${Math.round(r.duration_minutes / 60 * 10) / 10} hr` : null}
      breadcrumbs={[{ label: "Finance", href: "/console/finance" }, { label: "Time", href: "/console/finance/time" }, { label: row?.description ?? "Entry" }]}
      fields={row ? [
        { label: "Started", value: fmtDateTime(row.started_at) },
        { label: "Ended", value: fmtDateTime(row.ended_at) },
        { label: "Duration", value: row.duration_minutes != null ? `${Math.round(row.duration_minutes / 60 * 100) / 100} hr` : "—" },
        { label: "Billable", value: row.billable ? "Yes" : "No" },
        { label: "Description", value: row.description ?? "—" },
      ] : undefined}
    />
  );
}
